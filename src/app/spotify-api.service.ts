import { Injectable } from '@angular/core';

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
      fetch("http://localhost:5000/spotify/user_info",{
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

}
