/* eslint-env browser */

function postJSON(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open('post', url);
    request.onreadystatechange = () => {
        if (callback) {
            callback(request);
        };
    }
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(data))
}

let pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:ht.chinatcc.com:19302'
    }
  ]
})
var log = msg => {
  document.getElementById('logs').innerHTML += msg + '<br>'
}

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    document.getElementById('videoloc').srcObject = stream
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    // Offer to receive 1 audio, and 1 video track
    pc.addTransceiver('video', {'direction': 'sendrecv'})
    pc.addTransceiver('audio', {'direction': 'sendrecv'})

    pc.createOffer().then(d => pc.setLocalDescription(d)).catch(log)
  }).catch(log)

pc.oniceconnectionstatechange = e => log(pc.iceConnectionState)
pc.onicecandidate = event => {
  if (event.candidate === null) {
    document.getElementById('localSessionDescription').value = btoa(JSON.stringify(pc.localDescription))
    var channel = "c" + Date.now()
    var dat = {SDP:btoa(JSON.stringify(pc.localDescription)),Channel:"c"+Date.now()};
    log("开始录制")
    log("当前通道:"+channel)
    postJSON("https://webrtc-api.chinatcc.com/API/Record",dat,function(req){ 
        console.log(req)
        if (req.responseText.length>0) {
            var ret = JSON.parse(req.responseText)
            console.log(ret)
            if (ret["Success"]) {
                console.log("Success get peer:",ret["Data"])
                document.getElementById('remoteSessionDescription').value=ret["Data"]
                //windows.startSession()
                var sd = ret["Data"]
                try {
                  pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sd))))
                } catch (e) {
                  alert(e)
                }
            } else {
                console.log("Fail to get peer, fail reason:",ret["Message"])
            }
        }
    });
  }
}

pc.ontrack = function (event) {
  console.log(event)
  if (event.track.kind  == "video" ) {
    document.getElementById('video1').srcObject=event.streams[0]    
  }
    /*
  var el = document.createElement(event.track.kind)
  el.srcObject = event.streams[0]
  el.autoplay = true
  el.controls = true

  document.getElementById('remoteVideos').appendChild(el)*/
}

window.startSession = () => {
  let sd = document.getElementById('remoteSessionDescription').value
  if (sd === '') {
    return alert('Session Description must not be empty')
  }

  try {
    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sd))))
  } catch (e) {
    alert(e)
  }
}
