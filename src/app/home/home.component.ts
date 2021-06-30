import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SpotifyApiService } from '../spotify-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SongDataService, TrackDataModel } from '../song-data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  alreadySignedIn : Boolean = false;
  songsLoaded : Boolean = false;
  value = '';

  test_data : Array<any> = [
    {name: "asshole", artist: "hooligan chase", genre: "rock"},
    {name: "home is for the heartless", artist: "parkway drive", genre: "jazz"},
    {name: "online lover", artist: "unknown", genre: "indie"},
    {name: "cupids bow", artist: "crash", genre: "rock pop"},
    {name: "holdens crap fest", artist: "awesome", genre: "metalcore"},
    {name: "devils smile", artist: "trager jost band", genre: "art ka"},
    {name: "palace parade", artist: "crash bandihoot", genre: "glam rock"},
    {name: "beers", artist: "dankerfest", genre: "rock"},
  ]
  displayedColumns = ["select", "image", "name", "genre"];
  
  public songs!:MatTableDataSource<TrackDataModel>;
  @ViewChild(MatPaginator) paginator!: MatPaginator; 
  allSongsSelected : boolean = false;
  
  constructor(private spotify : SpotifyApiService, 
              private route : ActivatedRoute,
              private track_data : SongDataService) {}

  ngOnInit(): void {
    console.log(this.alreadySignedIn);
    this.route.queryParams.subscribe(params => {
      this.spotify.spotifyGetAccessCode(params['code']).then(() => {
        this.spotify.getUserInfo().then(res => {
          this.alreadySignedIn = true;
          this.spotify.getAllUserTracks().then(data => {
            this.track_data.setData(data as unknown as Array<TrackDataModel>);
            this.track_data.setPaginator(this.paginator);
            this.songs = this.track_data.getMatTable();
            this.songsLoaded = true;
          });
        });
      });
    })
  }

  applyFilter(event: Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.songs.filter = filterValue.trim().toLowerCase();
  }

  isAllSelected(){
    if(this.songs != null){
      const numSelected = this.songs.data.filter(t => t.selected == true).length;
      const numRows = this.songs.data.length;
      return numSelected == numRows;
    }
    return true;
  }

  selectSong(song : TrackDataModel){
    song.selected = !song.selected;
  }
  selectAllSongs(selectAll : boolean){
    this.allSongsSelected = selectAll;
    this.songs.data.forEach(t => t.selected = selectAll);
  }
  masterToggleIntermediate(){
    if(this.songs != null){
      var someSelected = this.songs.data.filter(t => t.selected == true).length > 0;
      return someSelected && !this.isAllSelected();
    }
    return true;
  }
}