import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyApiService } from '../spotify-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { SongDataService, TrackDataModel } from '../song-data.service';
import { MatSort, Sort } from '@angular/material/sort';
import default_data from '../../assets/default_tracks.json';
import { NONE_TYPE } from '@angular/compiler';

// TODO:
// EDIT UNCLASSIFIED GENRES
// ADD SONGS NOT FROM LIBRARY
// SIDEBAR LIST WITH ALL PLAYLISTS
// KEYS AND DB PASSWORDS IN ONE FILE

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  value = '';
  loaded = false;
  navigateDisabled = true;
  userInfo = {};
  userImage = '';

  filterColumns = ["name", "artist", "album", "genre", "date_added"];
  filter = '';

  displayedColumns = ["select", "image", "name", "artist", "album", "genre", "date_added"];
  pageSizeOptions = [30, 50, 75, 100, 150];
  pageSize = 30;
  currentPage = 0;
  
  public songs !:MatTableDataSource<TrackDataModel>;
  @ViewChild(MatPaginator) paginator!: MatPaginator; 
  @ViewChild(MatSort) sort !: MatSort;
  allSongsSelected : boolean = false;
  
  constructor(private spotify : SpotifyApiService, 
              private route : ActivatedRoute,
              private router : Router,
              private track_data : SongDataService) {}

  ngOnInit(): void {
    // setup fake loading data
    this.songs = new MatTableDataSource(default_data.tracks as unknown as Array<TrackDataModel>);
    this.songs.paginator = this.paginator;
    this.songs.sort = this.sort;
    localStorage.removeItem("current_playlist_songs");

    var url = this.router.url.split("?")[0];
    if(url == "/spotify-authorize-redirect"){
      this.route.queryParams.subscribe(params => {
        this.spotify.spotifyGetAccessCode(params['code']).then(() => {
          this.router.navigate(['/home']);
        }).catch(() => console.log("error getting access code for spotify"));
      })
    } else if(url == "/home") {
      this.track_data.checkSongsSaved().then(saved => {
        this.spotify.getUserInfo().then(user_info => {
          if(!saved){
            // get code and send it to new /home url
            console.log("getting songs from api");
            this.spotify.getAllUserTracks().then(data => {
              var datatable = this.track_data.setData(data as unknown as Array<TrackDataModel>);
              localStorage.setItem("tracks", JSON.stringify(datatable.data));
              this.setup(datatable);
            }).catch(() => {
              this.router.navigate(['/']);
            });
          } else {
            console.log("getting songs from database");
            this.track_data.getSavedSongs().then(data => {
              var d = this.track_data.setData(data as unknown as TrackDataModel[]);
              this.setup(d);
            });
          }
          this.userInfo = user_info;
          this.userImage = user_info.image;
        }).catch(() => this.router.navigate(['']));
      })
    }
  }
  signOut(){
    this.spotify.spotifySignOut();
    this.router.navigate(['/']);
    console.log("spotify sign out");
  }
  setup(data : any){
    this.songs = data;
    this.songs.paginator = this.paginator;
    this.songs.sort = this.sort;
    this.customFilter();
    this.loaded = true;
    document.getElementById("tracks-table")?.classList.remove("blur");
    document.getElementById("tracks-table")?.classList.add("no-blur");
  }

  customFilter(){
    this.songs.filterPredicate = ((data : TrackDataModel, filterString : string) : boolean => {
      switch (this.filter){
        case "name":
          var s = data.name.toLowerCase().indexOf(filterString) != -1;
          if (!s) data.selected = false; 
          return s;
        case "artist":
          var d = data.artist.toLowerCase().indexOf(filterString) != -1;
          if (!d) data.selected = false;
          return d;
        case "album":
          var a = data.album.toLowerCase().indexOf(filterString) != -1;
          if (!a) data.selected = false;
          return a;
        case "genre":
          var b = data.genre.toLowerCase().indexOf(filterString) != -1;
          if (!b) data.selected = false;
          return b;
        case "date_added":
          var c = data.date_added.toLowerCase().indexOf(filterString) != -1;
          if (!c) data.selected = false;
          return c;
      }
      return true;
    })
  }

  navigateCreatePlaylist(){
    this.router.navigate(['/create-playlist']);
  }
  applyFilter(event: Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.songs.filter = filterValue.trim().toLowerCase();
    if (this.songs.paginator) {
      this.songs.paginator.firstPage();
    }
  }
  setFilter(filterString : string){
    this.filter = filterString;
  }
  isAllSelected(){
    if(this.songs != null){
      var numSelected = 0;
      var total = (this.songs.data.length < this.currentPage+this.pageSize) ? this.songs.data.length : this.currentPage+this.pageSize;
      for(var i = this.currentPage; i < total; i++){
        if(this.songs.data[i].selected) numSelected += 1;
      }
      return numSelected == this.pageSize;
    }
    return false;
  }

  selectSong(song : TrackDataModel){
    song.selected = !song.selected;
    if(this.songs.data.some(t => t.selected)) this.navigateDisabled = false;
  }
  selectAllSongs(selectAll : boolean){
    if(selectAll){
      for(var i = this.currentPage; i < this.currentPage+this.pageSize; i++){
        this.songs.data[i].selected = selectAll;
      }
    } else {
      for(var j = this.currentPage; j < this.currentPage+this.pageSize; j++){
        this.songs.data[j].selected = selectAll
      }
    }
    this.allSongsSelected = selectAll;
  }
  masterToggleIntermediate(){
    if(this.songs != null){
      var someSelected = false;
      for(var i = this.currentPage; i < this.currentPage+this.pageSize; i++){
        if (this.songs.data[i].selected){
          break;
        }
      }
      return someSelected && !this.isAllSelected();
    }
    return true;
  }
  sortData(s : Sort){
    const isAsc = s.direction === 'asc';
    switch(s.active){
      case 'name':
        this.songs.sortData = (a : Array<TrackDataModel>, s : MatSort) => {
          return a.sort((b:TrackDataModel, c:TrackDataModel) => {
            return (b.name[0].toLowerCase() > c.name[0].toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
          })
        }
        break;
      case 'artist':
        this.songs.sortData = (a : Array<TrackDataModel>, s : MatSort) => {
          return a.sort((b:TrackDataModel, c:TrackDataModel) => {
            return (b.artist[0].toLowerCase() > c.artist[0].toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
          })
        }
        break;
        case 'album':
          this.songs.sortData = (a : Array<TrackDataModel>, s : MatSort) => {
            return a.sort((b:TrackDataModel, c:TrackDataModel) => {
              return (b.album[0].toLowerCase() > c.album[0].toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
            })
          }
          break;
          case 'genre':
            this.songs.sortData = (a : Array<TrackDataModel>, s : MatSort) => {
              return a.sort((b:TrackDataModel, c:TrackDataModel) => {
                return (b.genre[0].toLowerCase() > c.genre[0].toLowerCase() ? -1 : 1) * (isAsc ? 1 : -1);
              })
            }
            break;
          case 'date_added':
            this.songs.sortData = (a : Array<TrackDataModel>, s : MatSort) => {
              return a.sort((b:TrackDataModel, c:TrackDataModel) => {
                let date_b = new Date(b.date_added);
                let date_c = new Date(c.date_added);
                return (date_b > date_c ? 1 : -1) * (isAsc ? 1 : -1);
              })
            }
    }
  }
  refresh(){
    this.track_data.clearSongs();
    window.location.reload();
  }

  clickTrack(track : TrackDataModel){
    track.selected = !track.selected;
  }
  onPageChange(event : PageEvent){
    this.currentPage = event.pageIndex * this.pageSize;
  }
}