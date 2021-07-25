from flask import Flask, request
from flask_cors import CORS
import dateparser
import requests
import mysql.connector
import urllib
import base64
import json

keys_json = json.load(open('../src/assets/keys.json',))
SPOTIFY_CLIENT = keys_json['spotify_api']['SPOTIFY_CLIENT']
SPOTIFY_SECRET = keys_json['spotify_api']['SPOTIFY_SECRET']
SPOTIFY_SCOPE = keys_json['spotify_api']['SPOTIFY_SCOPE']
SPOTIFY_REDIRECT = keys_json['spotify_api']['SPOTIFY_REDIRECT']

DATABASE_HOST = keys_json['database']['HOST']
DATABASE_USER = keys_json['database']['USER']
DATABASE_PASSWORD = keys_json['database']['PASSWORD']
DATABASE_NAME = keys_json['database']['NAME']

app = Flask(__name__)
CORS(app)

access_token = ''
refresh_token = ''
expires_in = ''
all_songs = []
user_id = ''

database_connection = mysql.connector.connect(
    host=DATABASE_HOST,
    user=DATABASE_USER,
    password=DATABASE_PASSWORD,
    database=DATABASE_NAME
) 

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

@app.route('/spotify/user_info', methods=["GET"])
def spotify_user_info():
    global access_token, user_id
    headers = {"Authorization": "Bearer " + access_token}
    r = requests.get("https://api.spotify.com/v1/me", headers=headers)
    data = json.loads(r.text)
    json_data = None
    return_status_code = 200
    if(r.status_code == 200):
        json_data = {
            "display_name": data['display_name'],
            "username": data['id'],
            "country": data['country'],
            "email": data['email'],
            "image": data['images'][0]['url'],
            "type": data['product']
        }
        user_id = data['id']
    else: return_status_code = 400
    res = app.response_class(
        json.dumps(json_data),
        content_type='application/json',
        status=return_status_code
    )
    return res

@app.route('/spotify/get_all_songs')
def spotify_get_all_songs():
    global all_songs
    songs = []
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
        formatted_date = str(date.year) + '-' + str(date.month) + '-' + str(date.day)
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
    all_songs = songs
    spotify_get_all_song_genres()

    json_song_data = json.dumps(songs)
    response = app.response_class(
        response=json_song_data,
        mimetype='application/json'
    )
    return response

def spotify_get_50_songs(offset):
    global access_token
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get("https://api.spotify.com/v1/me/tracks?limit=50&offset="+str(offset), headers=headers)
    return json.loads(r.text)['items']

def spotify_get_all_song_genres():
    global all_songs
    genres = []
    index = 0
    # get genres 50 at a time till gone to end of song list
    while index < len(all_songs):
        current = get_genre(x['artist_id'] for x in all_songs[index:index+50])
        for single in current:
            if len(single) > 0:
                s = [x.capitalize() for x in single]
                genres.append(s)
            else: genres.append(['Unclassified'])
        index += len(current)
    # each song/artist has multiple genres
    # if there are no genres mark is unclassified (later add option so you can edit genre)
    
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
    print(response_json)
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
    if json_data['image'] != 'none':
        upload_playlist_image(json_data['image'], response_json['id'])

    res = app.response_class(
        response=response_json,
        mimetype= 'application/json')
    return res

@app.route('/spotify/get_playlists')
def get_20_playlists():
    global access_token
    headers = {"Authorization": "Bearer " + access_token}
    r = requests.get("https://api.spotify.com/v1/me/playlists?limit=30", headers=headers)
    json_data = json.loads(r.text)
    playlists = []
    for item in json_data['items']:
        c = {"collaborative": "","href":"","id":"","image":"","name":"","public":"","track_count":""}
        c['collaborative'] = item['collaborative']
        c['href'] = item['href']
        c['id'] = item['id']
        c['image'] = item['images'][0]['url'] if len(item['images']) > 0 else 'null'
        c['name'] = item['name']
        c['public'] = item['public']
        c['track_count'] = item['tracks']['total']
        playlists.append(c)
    response = app.response_class(
        response=json.dumps(playlists),
        mimetype="application/json"
    )
    return response

def add_tracks_to_playlist(playlist_id, access_token, track_uris):
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": "Bearer " + access_token, "Content-Type": "application/json"}
    body = {"uris": track_uris}
    r = requests.post(url, headers=headers, data=json.dumps(body))

def upload_playlist_image(image, playlist_id):
    global access_token
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/images"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "image/jpeg"}
    body = {"image": image}
    r = requests.put(url, headers=headers, data=image)
    res = r.text