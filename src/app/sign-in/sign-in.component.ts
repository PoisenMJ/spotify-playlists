import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyApiService } from '../spotify-api.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  constructor(private spotify : SpotifyApiService,
              private router : Router) { }

  ngOnInit(): void {
    if(localStorage.getItem("tracks") != null){
      this.router.navigate(['/home']);
    }
  }

  spotifyRedirectToLogin(){
    this.spotify.spotifyRedirectToLogin();
  }
}
