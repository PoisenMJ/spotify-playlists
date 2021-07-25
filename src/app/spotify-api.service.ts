import { Injectable } from '@angular/core';
import { TrackDataModel } from './song-data.service';

import keys_data from '../assets/keys.json';
const SPOTIFY_CLIENT = keys_data.spotify_api.SPOTIFY_CLIENT;
const SPOTIFY_SCOPE = keys_data.spotify_api.SPOTIFY_SCOPE;
const SPOTIFY_REDIRECT = keys_data.spotify_api.SPOTIFY_REDIRECT;

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {

  constructor() { }

  spotifyRedirectToLogin():Promise<void>{
    return new Promise<void>(resolve => {
      var authorizeURL = "https://accounts.spotify.com/authorize?";
      var s = 'response_type=code' + '&client_id='+SPOTIFY_CLIENT+'&scope='+encodeURIComponent(SPOTIFY_SCOPE)+'&redirect_uri='+encodeURIComponent(SPOTIFY_REDIRECT)+'&state='+(Math.random().toString(16).substr(2, 8)+'&show_dialog=true');
      window.location.href = authorizeURL + s;
      resolve();
    })
  }
  spotifySignOut(){
    localStorage.removeItem("tracks");
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
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        } 
      }).then(response => response.json()).then(data => resolve(data));
    })
  }
  getAllUserTracks() : Promise<void>{
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/spotify/get_all_songs", {
        method: "GET"
      }).then(response => response.json()).then(data => resolve(data));
    })
  }
  createPlaylist(tracks : Array<TrackDataModel>,
                  playlist_name : string,
                  playlist_visibility : string,
                  playlist_collaborative : string,
                  playlist_description : string,
                  playlist_image : string){
    return new Promise<void>(resolve => {
      var uri_array : Array<String> = [];
      tracks.forEach((value) => {
        uri_array.push(value.id)
      });
      let payload_dict = {name: playlist_name,
                          visibility: playlist_visibility,
                          collaborative: playlist_collaborative,
                          description: playlist_description,
                          tracks: uri_array,
                          image: playlist_image ? playlist_image : "none"};
      fetch("http://localhost:5000/spotify/create_playlist", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload_dict)
      }).then(response => {
        if(response.status == 200) resolve()
      });
    })
  }
  getPlaylists(){
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/spotify/get_playlists", {
        method: "GET"
      }).then(response => response.json()).then(json_data => resolve(json_data));
    })
  }
}
