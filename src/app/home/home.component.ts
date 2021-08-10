import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyApiService } from '../spotify-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { SongDataService, TrackDataModel } from '../song-data.service';
import { MatSort, Sort } from '@angular/material/sort';
import default_data from '../../assets/default_tracks.json';
import { FooterComponent } from '../footer/footer.component';

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

  isMobile = true;
  
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
    sessionStorage.removeItem("current_playlist_songs");

    // window.mobileCheck = function() {
    //   let check = false;
    //   (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    //   return check;
    // };
    // const isMobileDevice = /Mobi/i.test(window.navigator.userAgent)
    // function _isMobile(){
    //   // if we want a more complete list use this: http://detectmobilebrowsers.com/
    //   // str.test() is more efficent than str.match()
    //   // remember str.test is case sensitive
    //   var isMobile = (/iphone|ipod|android|ie|blackberry|fennec/).test(navigator.userAgent.toLowerCase());
    //   return isMobile;
    // }
    if(window.innerWidth < 600){
      this.displayedColumns = ["image", "name", "genre", "date_added"];
      this.isMobile = true;
    }
    else {
      this.displayedColumns = ["select", "image", "name", "artist", "album", "genre", "date_added"];
      this.isMobile = false;
    }

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
          if(user_info.failed == "true"){
            sessionStorage.removeItem("tracks");
            this.router.navigate(['/home']);
          }
          if(!saved){
            // get code and send it to new /home url
            console.log("getting songs from api");
            this.spotify.getAllUserTracks().then(data => {
              var datatable = this.track_data.setData(data as unknown as Array<TrackDataModel>);
              sessionStorage.setItem("tracks", JSON.stringify(datatable.data));
              this.setup(datatable);
            }).catch(() => {
              sessionStorage.removeItem("tracks");
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
        }).catch(() => {
          sessionStorage.removeItem("tracks");
          this.router.navigate([''])
        });
      })
    }
  }
  signOut(){
    this.spotify.spotifySignOut();
    this.router.navigate(['/']);
  }
  setup(data : any){
    this.songs = data;
    this.songs.paginator = this.paginator;
    this.songs.sort = this.sort;
    // this.customFilter();
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
    console.log("HELLO");
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
    this.updateNavigateDisabled();
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
  updateNavigateDisabled(){
    if(this.songs.data.some(t => t.selected)) this.navigateDisabled = false;
    else this.navigateDisabled = true;
  }
  clickTrack(track : TrackDataModel){
    track.selected = !track.selected;
    this.updateNavigateDisabled();
  }
  setSelected(row: any){
    console.log(row);
    if(row.classList.contains("selected")) row.classList.remove("selected");
    else row.classList.add("selected");
  }
  onPageChange(event : PageEvent){
    this.currentPage = event.pageIndex * this.pageSize;
  }
}