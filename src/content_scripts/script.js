browser.runtime.onMessage.addListener(function(request) {
    if(request.command === "downloadMessageSelected") {
        while(selectedSongs.length > 0) {
            let key = selectedSongs.pop();
            download(key);
        }
    }
    else if(request.command === "downloadMessageAlbumPlaylist") {
        var url = window.location.href.split("/");
        albumPlaylistId = url[url.length-1];
        let req = new XMLHttpRequest();

        if(url[4] == "playlist") {
            req.open("GET", "https://api.deezer.com/playlist/"+albumPlaylistId);
        }
        else if(url[4] == "album") {
            req.open("GET", "https://api.deezer.com/album/"+albumPlaylistId);
        }

        req.addEventListener('readystatechange', function() {
            if(this.readyState === XMLHttpRequest.DONE) {
                var tracks = JSON.parse(this.response)["tracks"]["data"];
                for(iTrack = 0; iTrack < tracks.length; iTrack++) {
                    download(tracks[iTrack]["id"].toString());
                }
            }
        });
        req.send(null);
    }
});

var selectedSongs = []

$(document).on('click','.checkbox-input',function() {
    let e = $(this);
    let id = e.parent().parent().parent()[0].dataset.key;
    if(e[0]["checked"] === true) {
        selectedSongs.push(id);
    }
    else {
        let idx = selectedSongs.indexOf(id);
        if (idx != -1) {
            selectedSongs.splice(selectedSongs.indexOf(id), 1);
        }
    }
});

function download(ids)
{
    function calcbfkey(ids) {
        var ret = "";
        const key = "g4el58wc0zvf9na1";
        for(i = 0; i < key.length; i++){
            var char = ids.charCodeAt(i)^ids.charCodeAt(i+16)^key.charCodeAt(i);
            ret = ret.concat(String.fromCharCode(char));
        }
        return ret;
    }

    function ultimatum(reqPicture, infos, name) {
        if(reqPicture.target.readyState === XMLHttpRequest.DONE) {
            infos["alb_picture_array"] = reqPicture.target.response;
            let ids = infos["SNG_ID"];
            let quality = "3";
            let info_md5 = infos["MD5_ORIGIN"];
            let hash = genurl(info_md5, quality, ids, infos["MEDIA_VERSION"]);

            let req = new XMLHttpRequest();
            req.open("GET", "https://e-cdns-proxy-"+info_md5[0]+".dzcdn.net/mobile/1/"+hash);
            req.responseType = "arraybuffer";
            req.addEventListener('readystatechange', function(e) {
                if(this.readyState === XMLHttpRequest.DONE) {
                    downloaded(e, infos);
                }
            });
            req.send(null);
        }
    }

    function getSongInfo(){
        if(this.readyState === XMLHttpRequest.DONE) {
            let infos = JSON.parse(this.response)["results"];
            let req = new XMLHttpRequest();

            req.open("GET", "https://e-cdns-images.dzcdn.net/images/cover/"+infos["ALB_PICTURE"]+"/1200x1200-000000-80-0-0.jpg");
            req.responseType = "arraybuffer";
            req.addEventListener('readystatechange', function(e) {
                if(this.readyState === XMLHttpRequest.DONE) {
                    ultimatum(e, infos, infos["SNG_TITLE"]);
                }
            });
            req.send(null);
        }
    }

    function genurl(infomd5, quality, ids, media) {
        var enc = new TextEncoder();
        let buffer = new ArrayBuffer(infomd5.length + quality.length + ids.length + media.length + 3);
        let data = new Uint8Array(buffer);
        var index = 0;
        var t = 0;

        [infomd5, quality, ids, media].forEach(function(element) {
            for(i=0; i < element.length; i++) {
                data[i+index] = enc.encode(element[i]);
            }
            if(t != 3) {
                index += element.length;
                data[index] = 0xa4;
                index += 1;
            }
            t += 1;
        });

        var dec = new TextDecoder("utf-8");

        //Taille ArrayBuffer - Doit être un multiple de 16
        var tailleBuffer = md5(data).length + data.length + 2;
        if (tailleBuffer % 16) {
            tailleBuffer += 16 - (tailleBuffer) % 16;
        }
        /////////
        
        let buffer2 = new ArrayBuffer(tailleBuffer);
        let data2 = new Uint8Array(buffer2);
        var index = 0;
        var t = 0;

        [md5(data), data].forEach(function(element){
            if(typeof(element) === "string") {
                for(i=0; i < element.length; i++) {
                    data2[i+index] = enc.encode(element[i]);
                }
            }
            else if(typeof(element) === "object") {
                for(i=0; i < element.length; i++) {
                    data2[i+index] = element[i];
                }
            }
            if(t != 2) {
                index += element.length;
                data2[index] = 0xa4;
                index += 1;
            }
            t += 1;
        });

        let key = [ 0x6a, 0x6f, 0x36, 0x61, 0x65, 0x79, 0x36, 0x68, 0x61, 0x69, 0x64, 0x32, 0x54, 0x65, 0x69, 0x68 ];
        var aesEcb = new aesjs.ModeOfOperation.ecb(key);
        var encryptedBytes = aesEcb.encrypt(data2);
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

        return encryptedHex;
    }

    function downloaded(that, infos) {
        if(that.target.readyState === XMLHttpRequest.DONE) {
            var arraybuffer = that.target.response;
            var decrypted = new Uint8Array(arraybuffer.byteLength);
            var seg = 0;
            const bf = new Blowfish(fbkey, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
            bf.setIv(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]));
            
            for(i=0; i < arraybuffer.byteLength; i+=2048) {
                if ((arraybuffer.byteLength - i) >= 2048) {
                    var byteArray = new Uint8Array(arraybuffer, i, 2048);
                }
                else {
                    var byteArray = new Uint8Array(arraybuffer, i, arraybuffer.byteLength - i);
                }

                if ((seg%3 == 0) && byteArray.length == 2048) {
                    decrypted.set(bf.decode(byteArray, Blowfish.TYPE.UINT8_ARRAY), i);
                }
                else {
                    decrypted.set(byteArray, i);
                }
                seg += 1;
            }

            var req = new XMLHttpRequest();
            req.open("GET", "https://api.deezer.com/album/"+infos["ALB_ID"]);
            req.addEventListener('readystatechange', function(e) {
                if(this.readyState === XMLHttpRequest.DONE) {
                    var genres = [];
                    var genresData = JSON.parse(this.response)["genres"]['data'];
                    for(iGenre = 0; iGenre < genresData.length; iGenre++) {
                        genres.push(genresData[iGenre]["name"]);
                    }
                    var artists = [];
                    for(nbArtists=0; nbArtists < infos["ARTISTS"].length; nbArtists++) {
                        artists.push(infos["ARTISTS"][nbArtists]["ART_NAME"]);
                    }
                    const writer = new ID3Writer(decrypted);
                    writer.setFrame('TIT2', infos["SNG_TITLE"]);
                    writer.setFrame('TPE1', artists);
                    writer.setFrame('TALB', infos["ALB_TITLE"]);
                    writer.setFrame('TYER', infos["PHYSICAL_RELEASE_DATE"].split("-")[0]);
                    writer.setFrame('TRCK', infos["TRACK_NUMBER"]);
                    writer.setFrame('APIC', {
                        type: 3,
                        data: infos["alb_picture_array"],
                        description: 'Album picture'
                    });
                    writer.setFrame('TCON', genres);
                    browser.runtime.sendMessage({command: "dlThis", name: artists + '-' + infos["SNG_TITLE"]+".mp3", blob: writer.getBlob()});
                }
            });
            req.send(null);
        }
    }

    const fbkey = calcbfkey(md5(ids));

    let req = new XMLHttpRequest();
    req.open("POST", "https://www.deezer.com/ajax/gw-light.php?api_version=1.0&api_token=null&input=3&method=deezer.getUserData");
    req.addEventListener('readystatechange', function() {
        if(this.readyState === XMLHttpRequest.DONE) {
            let token = JSON.parse(this.response)["results"]["checkForm"];
            let json = JSON.stringify({"sng_id": ids});
            let req = new XMLHttpRequest();

            req.open("POST", "https://www.deezer.com/ajax/gw-light.php?api_version=1.0&api_token="+token+"&input=3&method=song.getData");
            req.addEventListener('readystatechange', getSongInfo);
            req.send(json);
        }
    });
    req.send(null);
}
