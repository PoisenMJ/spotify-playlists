from keys import SPOTIFY_CLIENT, SPOTIFY_SECRET, SPOTIFY_SCOPE, SPOTIFY_REDIRECT
from flask import Flask, request
from flask_cors import CORS
import dateparser
import requests
import urllib
import base64
import json
import os

app = Flask(__name__)
CORS(app)

access_token = ''
refresh_token = ''
expires_in = ''
all_songs = []
user_id = ''

@app.route('/spotify/access_token')
def spotify_get_access_token():
    global access_token, refresh_token, expires_in
    payload_dict = {"code": request.args.get('code'), "grant_type": "authorization_code", "redirect_uri": SPOTIFY_REDIRECT}
    encoded_auth_string = str(base64.b64encode(f"{SPOTIFY_CLIENT}:{SPOTIFY_SECRET}".encode("utf-8")), "utf-8")
    headers = {"Authorization": f"Basic {encoded_auth_string}"}
    r = requests.post("https://accounts.spotify.com/api/token", data=payload_dict, headers=headers)
    data = json.loads(r.text)
    access_token = data['access_token']
    refresh_token = data['refresh_token']
    expires_in = data['expires_in']
    json_data = json.dumps({"access_token":access_token, 
                    "refresh_token":refresh_token, 
                    "expires_in":expires_in})
    response = app.response_class(
        response=json_data,
        mimetype='application/json'
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.route('/spotify/user_info')
def spotify_user_info():
    global access_token, user_id
    headers = {"Authorization": "Bearer " + access_token}
    r = requests.get("https://api.spotify.com/v1/me", headers=headers)
    data = json.loads(r.text)
    json_data = json.dumps({
        "display_name": data['display_name'],
        "username": data['id'],
        "country": data['country'],
        "email": data['email'],
        "image": data['images'][0]['url'],
        "type": data['product']
    })
    user_id = data['id']
    response = app.response_class(
        response=json_data,
        mimetype='application/json'
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.route('/spotify/get_all_songs')
def spotify_get_all_songs():
    global all_songs
    songs = []
    if os.path.exists(os.path.join(os.path.curdir, 'saved_songs.json')):
        print("reading songs")
        with open('./saved_songs.json', 'r+') as f:
            data = json.load(f)
            for i in range(len(data['names'])):
                cur = {"name": "", "artist": "", "artist_id": "", "date_added": ""}
                cur['name'] = data['names'][i]
                cur['artist'] = data['artists'][i]
                cur['artist_id'] = data['artist_ids'][i]
                cur['album'] = data['albums'][i]
                cur['image'] = data['images'][i]
                cur['date_added'] = data['date_added'][i]
                cur['id'] = data['ids'][i]
                cur['position'] = i
                cur['selected'] = True
                songs.append(cur)
    else:
        offset = 0
        finished = False
        while(not finished):
            c = spotify_get_50_songs(offset)
            offset += 50
            songs.append(c)
            if(len(c) < 50): finished = True
        songs = [song for s in songs for song in s]
        for i in range(len(songs)):
            #format songs
            date = dateparser.parse(songs[i]['added_at'])
            formatted_date = str(date.year) + '/' + str(date.month) + '/' + str(date.day)
            songs[i] = {
                'name': songs[i]['track']['name'],
                'artist': songs[i]['track']['album']['artists'][0]['name'],
                'artist_id': songs[i]['track']['album']['artists'][0]['id'],
                'image': songs[i]['track']['album']['images'][0]['url'],
                'album': songs[i]['track']['album']['name'],
                'date_added': formatted_date,
                'id': songs[i]['track']['uri'],
                'position': i,
                'selected': False
            }
        json_dict = {
            "names": [],
            "artists": [],
            "artist_ids": [],
            "images": [],
            "albums": [],
            "date_added": [],
            "ids": []
        }
        for song in songs:
            json_dict['names'].append(song['name'])
            json_dict['artists'].append(song['artist'])
            json_dict['artist_ids'].append(song['artist_id'])
            json_dict['images'].append(song['image'])
            json_dict['albums'].append(song['album'])
            json_dict['date_added'].append(song['date_added'])
            json_dict['ids'].append(song['id'])
        f = open('./saved_songs.json', 'w')
        json.dump(json_dict, f)
        f.close()
    all_songs = songs
    spotify_get_all_song_genres()

    json_song_data = json.dumps(songs)
    response = app.response_class(
        response=json_song_data,
        mimetype='application/json'
    )
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

def spotify_get_50_songs(offset):
    global access_token
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get("https://api.spotify.com/v1/me/tracks?limit=50&offset="+str(offset), headers=headers)
    return json.loads(r.text)['items']

def spotify_get_all_song_genres():
    global all_songs
    genres = []
    with open('./saved_songs.json', 'r+') as f:
        data = json.load(f)
        if 'genres' in list(data.keys()):
            for d in data['genres']:
                genres.append(d)
        else:
            temp = []
            index = 0
            # get genres 50 at a time till gone to end of song list
            while index < len(all_songs):
                current = get_genre(x['artist_id'] for x in all_songs[index:index+50])
                temp.append(current)
                index += len(current)
            # each song/artist has multiple genres
            # if there are no genres mark is unclassified (later add option so you can edit genre)
            for d in temp:
                for s in d:
                    if len(s) > 0:
                        s = [x.capitalize() for x in s]
                        genres.append(s)
                    else: genres.append(['Unclassified'])
            # edit json object and overwhite with new genre info
            data.update({'genres': genres})
            f.seek(0)
            json.dump(data, f)
            # resize file with new data
            f.truncate()
    
    for index, song in enumerate(all_songs):
        song['genre'] = genres[index]

def get_genre(artists):
    global access_token
    artist_string = urllib.parse.quote(','.join(artists))
    headers = {"Authorization": "Bearer " + access_token}
    r = requests.get("https://api.spotify.com/v1/artists?ids=" + artist_string, headers=headers)
    a = json.loads(r.text)
    return [x['genres'] for x in a['artists']]

@app.route('/spotify/create_playlist', methods=["POST", "GET"])
def create_playlist():
    global user_id, access_token
    json_data = request.get_json()
    public = 'true' if json_data['visibility'] == 'Public' else 'false'
    headers = {"Authorization": "Bearer " + access_token}
    body = {"name": json_data['name'],
            "public": public,
            "collaborative": json_data['collaborative'],
            "description": json_data['description']}
    
    r = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                        headers=headers, data=json.dumps(body))
    response_json = json.loads(r.text)
    # successful creation

    if "id" in response_json:
        s = json_data['tracks']
        current = []
        for i,v in enumerate(s):
            if len(s) > 100:
                if len(current) < 100:
                    current.append(v)
                else:
                    add_tracks_to_playlist(response_json['id'], access_token, current)
                    current = []
            else:
                current.append(v)
                if i == len(s)-1: add_tracks_to_playlist(response_json['id'], access_token, current)
    
    res = app.response_class(
        response=response_json,
        mimetype= 'application/json')
    return res
    
def add_tracks_to_playlist(playlist_id, access_token, track_uris):
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": "Bearer " + access_token, "Content-Type": "application/json"}
    body = {"uris": track_uris}
    print(body)
    r = requests.post(url, headers=headers, data=json.dumps(body))
    print(json.loads(r.text))
    
