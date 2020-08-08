import AgoraRTC from "agora-rtc-sdk-ng";

import './hello.html';
import './hello.scss';

Meteor.subscribe('users');
Meteor.subscribe('lessons');

rootUrl = new ReactiveVar();

var client; // Agora client
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var remoteUsers = {};
// Agora client options
var options = {
  appid: "3f52f4ef54d4493986689268f42355bd",
  channel: null,
  uid: null,
  token: null,
  role: "audience" // host or audience
};

Template.hello.onCreated(()=> {
});

Template.hello.onRendered(()=> {
  if (FlowRouter.getRouteName() === 'sala-de-aula') {
    if (FlowRouter.getParam('tipoUsuario') === 'professor') {
      options.role = "host"
    }
    else if (FlowRouter.getParam('tipoUsuario') === 'aluno') {
      options.role = "audience"
      options.appid = "3f52f4ef54d4493986689268f42355bd";
      options.token = null;
    }

    options.channel = FlowRouter.getParam('idSala');
    join();

    $("#leave").click(function (e) {
      leave();
    })


  } // if URL de sala de aula
  else {
    // alert('A URL deve estar correta.')
  }
});

Template.hello.helpers({
  rootUrl() {
    Meteor.call('get.url', (err, res)=> {
      rootUrl.set(res);
    });
    return rootUrl.get();
  },

  dadosDaAula() {
    return {
      idSala: FlowRouter.getParam('idSala'),
      nomeSala: FlowRouter.getParam('nomeSala'),
      tipoUsuario: FlowRouter.getParam('tipoUsuario'),
      idUsuario: FlowRouter.getParam('idUsuario'),
      nomeUsuario: FlowRouter.getParam('nomeUsuario')
    }
  }
});

Template.hello.events({
});



async function join() {
  // create Agora client
  client = AgoraRTC.createClient({ mode: "live", codec: "h264", role: options.role });

  if (options.role === "audience") {
    // add event listener to play remote tracks when remote user publishs.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    $('#local-player').parent().remove();
  }

  // join the channel
  options.uid = await client.join(options.appid, options.channel, options.token || null);

  if (options.role === "host") {
    // create local audio and video tracks
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    // play local video track
    localTracks.videoTrack.play("local-player");
    // $("#local-player-name").text(`localTrack(${options.uid})`);
    // publish local tracks to channel
    await client.publish(Object.values(localTracks));
    // console.log("publish success");
  }
}

async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if(track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();

  $("#local-player-name").text("");
  $("#host-join").attr("disabled", false);
  $("#audience-join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  // console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  // console.log("subscribe success");
  if (mediaType === 'video') {
    const player = $(`
      <div id="player-wrapper-${uid}">
      <!-- <p class="player-name">remoteUser(${uid})</p> -->
      <div id="player-${uid}" class="player"></div>
      </div>
      `);
      $("#remote-playerlist").append(player);
      user.videoTrack.play(`player-${uid}`);
    }
    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  }

  function handleUserPublished(user, mediaType) {
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user, mediaType);
  }

  function handleUserUnpublished(user) {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
  }
