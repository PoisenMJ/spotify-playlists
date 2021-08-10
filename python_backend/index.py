from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Request
from pydantic import BaseModel
import dateparser
import requests
# import mysql.connector
import urllib
import base64
import json

origins = [
    "http://localhost:4200"
]

keys_json = json.load(open('../src/assets/keys.json',))
SPOTIFY_CLIENT = keys_json['spotify_api']['SPOTIFY_CLIENT']
SPOTIFY_SECRET = keys_json['spotify_api']['SPOTIFY_SECRET']
SPOTIFY_SCOPE = keys_json['spotify_api']['SPOTIFY_SCOPE']
SPOTIFY_REDIRECT = keys_json['spotify_api']['SPOTIFY_REDIRECT']

# DATABASE_HOST = keys_json['database']['HOST']
# DATABASE_USER = keys_json['database']['USER']
# DATABASE_PASSWORD = keys_json['database']['PASSWORD']
# DATABASE_NAME = keys_json['database']['NAME']

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

access_token = ''
refresh_token = ''
expires_in = ''
all_songs = []
user_id = ''

@app.get('/api/access_token')
async def spotify_get_access_token(code : str):
    global access_token, refresh_token, expires_in
    payload_dict = {"code": code, "grant_type": "authorization_code", "redirect_uri": SPOTIFY_REDIRECT}
    encoded_auth_string = str(base64.b64encode(f"{SPOTIFY_CLIENT}:{SPOTIFY_SECRET}".encode("utf-8")), "utf-8")
    headers = {"Authorization": f"Basic {encoded_auth_string}"}
    r = requests.post("https://accounts.spotify.com/api/token", data=payload_dict, headers=headers)
    data = json.loads(r.text)
    if 'error' in data:
        return JSONResponse(status_code=404, content={"failed": "true"})
    else:
        access_token = data['access_token']
        refresh_token = data['refresh_token']
        expires_in = data['expires_in']
        return {"access_token":access_token, "refresh_token":refresh_token, "expires_in":expires_in}

@app.get('/api/user_info')
def spotify_user_info():
    global access_token, user_id
    if access_token:
        headers = {"Authorization": "Bearer " + access_token}
        r = requests.get("https://api.spotify.com/v1/me", headers=headers)
        data = json.loads(r.text)
        if 'error' in data or r.status_code != 200:
            return JSONResponse(status_code=404, content={"failed": "true"})
        user_id = data['id']
        return {
            "display_name": data['display_name'],
            "username": data['id'],
            "country": data['country'],
            "email": data['email'],
            "image": data['images'][0]['url'],
            "type": data['product']
        }
    else:
        return JSONResponse(status_code=404, content={"failed": "true"})

@app.get('/api/get_all_songs')
def spotify_get_all_songs():
    global all_songs, access_token
    if access_token:
        songs = []
        offset = 0
        finished = False
        while(not finished):
            c = spotify_get_50_songs(offset, access_token)
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
        return songs
    else:
        return JSONResponse(status_code=404, content={"failed":  "true"})

def spotify_get_50_songs(offset, access_token):
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

@app.post('/api/create_playlist')
async def create_playlist(request : Request):
    global user_id, access_token
    if access_token and user_id:
        playlist_data = await request.json()
        public = 'true' if playlist_data['visibility'] == 'Public' else 'false'
        headers = {"Authorization": "Bearer " + access_token}
        body = {"name": playlist_data['name'],
                "public": public,
                "collaborative": playlist_data['collaborative'],
                "description": playlist_data['description']}
        print(body)
        r = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                            headers=headers, data=json.dumps(body))
        response_json = json.loads(r.text)
        if 'error' in response_json:
            return JSONResponse(status_code=404, content={"failed": "true"})
        # successful creation
        if "id" in response_json:
            s = playlist_data['tracks']
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
        if playlist_data['image'] != 'none':
            upload_playlist_image(playlist_data['image'], response_json['id'])
        return response_json
    else: return JSONResponse(status_code=404, content={"failed":"true"})

@app.get('/api/get_playlists')
def get_20_playlists():
    global access_token
    if access_token:
        headers = {"Authorization": "Bearer " + access_token}
        r = requests.get("https://api.spotify.com/v1/me/playlists?limit=30", headers=headers)
        json_data = json.loads(r.text)
        if 'error' in json_data:
            return JSONResponse(content={"failed": "true"}, status=404)
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
        return playlists
    else: return JSONResponse(status_code=404, content={"failed": "true"})

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