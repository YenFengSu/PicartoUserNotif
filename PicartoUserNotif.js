// ==UserScript==
// @name         Picarto Chat - User Notification
// @namespace    I don't know what this is.
// @version      0.2
// @updateURL    https://raw.githubusercontent.com/YenFengSu/PicartoUserNotif/master/PicartoUserNotif.js
// @description  Plays a sound everytime a new user enters the chat.  Regular user get a door creak, mods get a BANG.
// @author       HechTea
// @match        https://picarto.tv/chatpopout/*
// @match        https://picarto.tv/HechTea
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

    var volume = {
        door: 0.4,
        boom: 0.4
    };

    var users = {}; // Current users in chat
    var users_history = {}; // Last exit time
    var USER_STATUS = {
        mod_exist: 1, mod_tbd: -1,
        reg_exist: 2, reg_tbd: -2, /* tbd -> to be determined */
        guest_exist: 3, guest_tbd: -3
    };
    var interval_handle;
    var returning_interval = 1 * 60 * 1000; // 1 minute, in miliseconds

    function Init() {
        var audio_door = $("<audio />", {id: "audio_door"});
        var source_door = $("<source>", {src: "https://raw.githubusercontent.com/YenFengSu/PicartoUserNotif/master/471732__juanfg__chirp.wav"});
        source_door.appendTo(audio_door);
        audio_door.appendTo($("body"));

        var audio_boom = $("<audio />", {id: "audio_boom"});
        var source_boom = $("<source>", {src: "https://raw.githubusercontent.com/YenFengSu/PicartoUserNotif/master/33245__ljudman__grenade.wav"});
        source_boom.appendTo(audio_boom);
        audio_boom.appendTo($("body"));

        var button = $("<div />", {
            "class": "headingBtns settingsButton ml-1",
            id: "user-notification",
            stat: "disabled",
            on: {
                click: function() {
                    _Toggle_butt();
                }
            },
        });
        var butt_enable = $("<i />", {
            "class": "fas fa-play",
            id: "play-icon"
        });
        var butt_disable = $("<i />", {
            "class": "fas fa-stop",
            id: "stop-icon",
            style: "display: none"
        });


        butt_enable.appendTo(button);
        butt_disable.appendTo(button);
        button.appendTo($("#chatHeader").find("span"));
    }

    function _Toggle_butt () {
        var butt = $("#user-notification");
        if (butt.attr("stat") == "disabled") {
            Enable();
            butt.attr("stat", "enabled");
            $("#play-icon").css("display", "none");
            $("#stop-icon").css("display", "");
        } else if (butt.attr("stat") == "enabled") {
            Disable();
            butt.attr("stat", "disabled");
            $("#play-icon").css("display", "");
            $("#stop-icon").css("display", "none");
        }
    }

    function Play_door_creak() {
        $("#audio_door")[0].volume = volume.door;
        $("#audio_door")[0].play();
    }
    function Play_Boom() {
        $("#audio_boom")[0].volume = volume.boom;
        $("#audio_boom")[0].play();
    }

    function Enable () {
        Get_Users(true);
        interval_handle = setInterval(function(){_check_users();}, 1000);
    }

    function Disable () {
        users = {};
        clearInterval(interval_handle);
    }

    function _check_users() {
        Reset_Users();
        Get_Users();
        Check_Leaving();
    }

    function Reset_Users() {
        for(var key in users) {
            if (users[key] == USER_STATUS.mod_exist) {
                users[key] = USER_STATUS.mod_tbd;
            } else if (users[key] == USER_STATUS.reg_exist) {
                users[key] = USER_STATUS.reg_tbd;
            } else if (users[key] == USER_STATUS.guest_exist) {
                users[key] = USER_STATUS.guest_tbd;
            } else {
                // wut...
            }
        }
    }

    function Get_Users(first_time = false) {
        var reg_users = $("#regularUsers").children();
        var mods = $("#modUsers").children();
        var i;
        var name;
        var time = new Date();
        for (i = 0; i < reg_users.length; i++) {
            name = reg_users[i].getAttribute("data-displayname");

            if (!(name in users) && !first_time) {
                if (name in users_history) {
                    // returning user.
                    if (time.getTime() - users_history[name] <= returning_interval) {
                        // treat as a existing user.
                        users[name] = USER_STATUS.reg_exist;
                        console.log("An user re-joined the chat.\t\t" + name + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                        continue;
                    }
                }

                // new regular user.  beep.
                console.log("An user joined the chat!\t\t" + name + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                Play_door_creak();
            } else {
                // existing user, or is first time.  no beep.
            }
            users[name] = USER_STATUS.reg_exist;
        }

        for (i = 0; i < mods.length; i++) {
            name = mods[i].getAttribute("data-displayname");

            if (!(name in users) && !first_time) {
                if (name in users_history) {
                    // returning user.
                    if (time.getTime() - users_history[name] <= returning_interval) {
                        // treat as a existing user.
                        users[name] = USER_STATUS.mod_exist;
                        console.log("A moderator re-joined the chat!\t\t" + name + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                        continue;
                    }
                }

                // new moderator.  beep.
                console.log("A moderator joined the chat!\t\t" + name + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                Play_Boom();
            } else {
                // existing moderator, or is first time.  no beep.
            }
            users[name] = USER_STATUS.mod_exist;
        }
    }

    function Check_Leaving() {
        var time = new Date();

        for (var key in users) {
            if (users[key] == USER_STATUS.mod_tbd) {
                // a user/moderator left.  beep.
                console.log("A moderator left:\t\t" + key + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                delete users[key];
                users_history[key] = time.getTime();
            } else if (users[key] == USER_STATUS.reg_tbd) {
                // a user/moderator left.  beep.
                console.log("A regular user left:\t\t" + key + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                delete users[key];
                users_history[key] = time.getTime();
            } else if (users[key] == USER_STATUS.guest_tbd) {
                // a user/moderator left.  beep.
                console.log("A guest left:\t\t" + key + "\t\t" + time.getHours() + (time.getMinutes() < 10 ? ":0" : ":") + time.getMinutes());
                delete users[key];
                users_history[key] = time.getTime();
            } else {
                // wut...
            }
        }
    }

    Init();
})();
