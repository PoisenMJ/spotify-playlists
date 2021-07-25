import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CreatePlaylistComponent } from '../create-playlist/create-playlist.component';
import { SongDataService } from '../song-data.service';
import { SpotifyApiService } from '../spotify-api.service';
import { MatSnackBar, MatSnackBarContainer } from '@angular/material/snack-bar';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-create-playlist-dialog',
  templateUrl: './create-playlist-dialog.component.html',
  styleUrls: ['./create-playlist-dialog.component.scss']
})
export class CreatePlaylistDialogComponent implements OnInit {
  name : string = "Playlist Name";
  collaborative : boolean = false;
  public : boolean = true;
  description : string = "";
  image !: string;

  constructor(private dialogRef : MatDialogRef<CreatePlaylistComponent>,
              private spotifyAPI : SpotifyApiService,
              private track_data : SongDataService,
              private snackBar : MatSnackBar) { }

  ngOnInit(): void { }

  openSnackBar(){
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 2000,
    });
  }

  createPlaylist(){
    this.spotifyAPI.createPlaylist(this.track_data.getData(),
    this.name, 
    (this.public ? "Public" : "Private"),
    this.collaborative.toString(),
    this.description,
    this.image).then(data => {
      this.openSnackBar();
      this.dialogRef.close();
    });
  }

  onImageClick(){
    document.getElementById("image-file-input")?.click();
  }

  processImage(fileInput : any){
    const file = fileInput.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      var result = reader.result as string;
      console.log(Math.round(file.size/1000));
      if (Math.round(file.size/1000) < 256){
        document.getElementById('playlist-image')?.setAttribute('src', result);
        this.image = result.toString().replace(/^data:image.+;base64,/, '');
      } else alert('file size too large');
    }
  }
}

@Component({
  selector: 'snack-bar-component',
  template: `
    <span class='snackbar'>
      Playlist created.
    </span>
  `,
  styles: [`
    .snackbar{
      margin-right: 8px;
    }
  `]
})
export class SnackBarComponent {}
