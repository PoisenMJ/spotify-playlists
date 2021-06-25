import { Component, OnInit } from '@angular/core';
import { SpotifyApiService } from '../spotify-api.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.sass']
})
export class SignInComponent implements OnInit {

  constructor(private spotify : SpotifyApiService) { }

  ngOnInit(): void {
  }

  spotifyRedirectToLogin(){
    this.spotify.spotifyRedirectToLogin();
  }
}
