import { Component, OnInit } from '@angular/core';
import { SongDataService, TrackDataModel } from '../song-data.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreatePlaylistDialogComponent } from '../create-playlist-dialog/create-playlist-dialog.component';

@Component({
  selector: 'app-create-playlist',
  templateUrl: './create-playlist.component.html',
  styleUrls: ['./create-playlist.component.scss']
})
export class CreatePlaylistComponent implements OnInit {

  tracks : Array<TrackDataModel> = new Array<TrackDataModel>();

  private dialogRef !: MatDialogRef<CreatePlaylistDialogComponent>;

  constructor(private track_service : SongDataService,
              private dialog : MatDialog) { }

  ngOnInit(): void {
    var temp = this.track_service.getData();
    for(var i = 0; i < temp.length; i++){
      if(temp[i].selected == true){
        this.tracks.push(temp[i]);
      }
    }
    this.track_service.setData(this.tracks);
  }

  imageFileInput(){
    document.getElementById("image-file-input")?.click();
  }

  onImageFileSelected($event : any){
    var file = <File>$event.target.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      document.getElementById("playlist-image")?.setAttribute("src", reader.result as string);
    }
  }

  openPlaylistCreateDialog(){
    this.dialogRef = this.dialog.open(CreatePlaylistDialogComponent);
  }
  closePlaylistCreateDialog(){
    this.dialogRef.close();
  }
}
