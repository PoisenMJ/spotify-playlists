import { Injectable } from '@angular/core';
import { TrackDataModel } from './song-data.service';

var SPOTIFY_CLIENT = "4b6d0c642f6a4f97ae98fbd993ca6ec4";
var SPOTIFY_SECRET = "13f4f42053b647ee96e67c7decb95c31";
var SPOTIFY_SCOPE = "user-library-read user-read-email user-read-private";
var SPOTIFY_REDIRECT =  "http://localhost:4200/spotify-authorize-redirect";

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {

  constructor() { }

  spotifyRedirectToLogin():Promise<void>{
    return new Promise<void>(resolve => {
      var authorizeURL = "https://accounts.spotify.com/authorize?";
      var s = 'response_type=code' + '&client_id='+SPOTIFY_CLIENT+'&scope='+encodeURIComponent(SPOTIFY_SCOPE)+'&redirect_uri='+encodeURIComponent(SPOTIFY_REDIRECT)+'&state='+(Math.random().toString(16).substr(2, 8));
      window.location.href = authorizeURL + s;
      resolve();
    })
  }
  spotifyGetAccessCode(code : String) : Promise<void>{
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/spotify/access_token?code="+code, {
        method: "GET"
      }).then(response => response.json()).then(data => {
        resolve();
      })
    })
  }
  getUserInfo() : Promise<any>{
    return new Promise<any>(resolve => {
      fetch("http://localhost:5000/spotify/user_info", {
        method: "GET",
      }).then(response => response.json()).then((data) => {
        resolve(data);
      })
    })
  }
  getAllUserTracks() : Promise<void>{
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/spotify/get_all_songs", {
        method: "GET"
      }).then(response => response.json()).then(data => resolve(data));
    })
  }
  createPlaylist(tracks : Array<TrackDataModel>, playlist_name : string, playlist_visibility : string, playlist_collaborative : string, playlist_description : string){
    return new Promise<void>(resolve => {
      let payload_dict = {name: playlist_name,
                          visibility: playlist_visibility,
                          collaborative: playlist_collaborative,
                          description: playlist_description};
      fetch("http://localhost:5000/spotify/create_playlist", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload_dict)
      }).then(response => response.json()).then(data => resolve(data));
    })
  }
}
