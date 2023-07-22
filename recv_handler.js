autowatcher = 1;

const Max = require("max-api");
const fs = require("fs");
const { getAudioDurationInSeconds } = require('get-audio-duration');

const lerp_func = (x, y, a) => x * (1 - a) + y * a;
const clamp_func = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp_func = (x, y, a) => clamp_func((a - x) / (y - x));
const range_func = (x1, y1, x2, y2, a) => lerp_func(x2, y2, invlerp_func(x1, y1, a))

var msp_objects_state = new Object();

msp_objects_state = {
    // the main gain of the input signal to the guitar amp
    "mspmaingain": {"max": 127.0,
                "min": 0.0,
                "umax": 127.0,
                "umin": 0.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 114.0,
                "type": "perc"},

    // threshold of the guitar amp compressor
    "mspcompthresh": {"max": 6000,
                "min": 60,
                "umax": 6000,
                "umin": 60,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 60,
                "type": "perc"},

    // output level of the guitar amp overdrive
    "mspodlevel": {"max": 127.0,
                "min": 0.0,
                "umax": 127.0,
                "umin": 0.0,
                "cycle": 2000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 20,
                "type": "perc"},

    // lowshelf eq level for the guitar amp
    "msplowshelf": {"max": 58.0,
                "min": 0.0,
                "umax": 58.0,
                "umin": 0.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 13.0,
                "type": "perc"},

    // highshelf eq-level for the guitar amp
    "msphighshelf": {"max": 58.0,
                "min": 0.0,
                "umax": 58.0,
                "umin": 0.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 13.0,
                "type": "perc"},

    // varhard clip value
    "mspvarclip": {"max": 1000.0,
                "min": 1.0,
                "umax": 1000.0,
                "umin": 1.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 1.0,
                "type": "perc"},

    // varhard amp value
    "mspvaramp": {"max": 100.0,
                "min": 1.0,
                "umax": 100.0,
                "umin": 1.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 1.0,
                "type": "perc"},

    // upwards compressor raio
    "mspucratio": {"max": 0.99,
                "min": 0.01,
                "umax": 0.99,
                "umin": 0.01,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 0.01,
                "type": "perc"},
    
    // upwards compressor threshold
    "mspucthresh": {"max": -10.0,
                "min": -70.0,
                "umax": -10.,
                "umin": -70.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": -70.0,
                "type": "perc"},

    // cross freq for the 1 waveshaper
    "mspcrossfreq": {"max": 6000.0,
                "min": 20.0,
                "umax": 6000.0,
                "umin": 20.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 114.0,
                "type": "perc"},

    // cross freq for the 2 waveshaper
    "mspcrossfreq2": {"max": 6000.0,
                "min": 20.0,
                "umax": 6000.0,
                "umin": 20.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 114.0,
                "type": "perc"},

    // cross freq for the 3 waveshaper
    "mspcrossfreq3": {"max": 6000.0,
                "min": 20.0,
                "umax": 6000.0,
                "umin": 20.0,
                "cycle": 1000,
                "cmin": 50,
                "cmax": 10000,
                "loop": "",
                "current": 114.0,
                "type": "perc"},

    // max preset changer
    "msppresetchange": {"max": 100.0,
                "min": 1.0,
                "diff": 1.0,
                "current": 1.0,
                "type": "abs"},
    
    // max wav player
    "mspwavplay": {"max": 100.0,
                "min": 1.0,
                "diff": 1.0,
                "current": 1.0,
                "type": "abs"}
};

class InformationHandler {

    constructor(current_folder) {

        this.current_folder = current_folder;
        this.current_waves = "";
        this.n_mics = 1;
        this.fade_in = 300;
        Max.outlet("set_fades", "fadein", "set", this.fade_in)
        this.fade_out = 300;
        Max.outlet("set_fades", "fadeout", "set", this.fade_out)
        this.mic_play_gain = 0.5;
        Max.outlet("set_gains", "mic_gain", "set", this.mic_play_gain)
        this.wav_mic_play_gain = 0.5;
        Max.outlet("set_gains", "wav_mic_gain", "set", this.wav_mic_play_gain)
        this.sample_play_gain = 1;
        Max.outlet("set_gains", "sample_gain", "set", this.sample_play_gain)
        this.sample_wav_gain = 1;
        Max.outlet("set_gains", "wav_gain", "set", this.wav_play_gain)

    };

    set base_folder(current_folder) {

        this.current_folder = current_folder;
        var all_directories = fs.readdirSync(this.current_folder, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
        // verify if the folder already has a /audio subfolder. If not, make it.
        if (!all_directories.includes("audio")) {
            
            fs.mkdirSync(this.current_folder + "audio");

            Max.outlet("mics", "cantchange", "0");

        } else {
            const audio_in_folder = fs.readdirSync(this.current_folder + "audio", { withFileTypes: true }).filter(dirent => dirent.name.endsWith('.wav')).map(dirent => dirent.name);
            var largest_number = 1;

            for (const audio_name of audio_in_folder) {

                const tmp_number = parseInt(audio_name.split("mic")[1].replace(".wav", ""));

                if (tmp_number > largest_number) {

                    largest_number = tmp_number;

                };

            };
            
            this.output_message("mics", "set", largest_number)

            if (audio_in_folder.length > 0) {

                this.output_message("mics", "cantchange", "1");
                this.n_mics = largest_number;

            } else {
                
                this.output_message("mics", "cantchange", "0");
                this.n_mics = largest_number;

            };

        };
    };

    set fadein(fade_in_value) {
    
        this.fade_in = fade_in_value;
    };

    set fadeout(fade_out_value) {
    
        this.fade_out = fade_out_value;
    };


    decode_input(input_message) {

        const regexp = '\#(.+?)\%';

        const raw_input = [...input_message.matchAll(regexp)];

        const last_mess = raw_input[raw_input.length - 1];

        return last_mess[last_mess.length - 1].split("_");

    };

    record_snippet(snippet_number) {

        // for the number of mics
        // send open file_name wave
        // send 1
        for (const i of Array(this.n_mics).keys()) {
            
            const main_and_snippet = snippet_number.split("&")
            const file_name = this.current_folder + "audio/" + String(main_and_snippet[0]) + "_" + String(main_and_snippet[1]) + "_mic" + String(i+1) + ".wav";
            Max.outlet("rec", "mic"+String(i+1), "open", file_name, "wave");


        };

        for (const i of Array(this.n_mics).keys()) {

            Max.outlet("rec", "mic"+String(i+1), 1);

        };

    };

    stop_recording_snippet(next_main_number) {

        for (const i of Array(this.n_mics).keys()) {

            Max.outlet("rec", "mic"+String(i+1), 0);

        };

    };

    play_wav() {  

        const wav_idx = parseInt(msp_objects_state["mspwavplay"].current - 1).toString();

        if (this.current_waves.clips){
            if (wav_idx in this.current_waves.clips) {

                const duration = parseFloat(this.current_waves.clips[wav_idx].durationms);
                Max.post(duration)
                // activate the fade ins/outs necessary
                // send play message to each playercm
                var used_fadein = 0;
                var used_fadeout = 0;

                if (duration < this.fade_in + this.fade_out) {

                    used_fadein = (duration/2) | 0;
                    used_fadeout = (duration/2) | 0;

                } else {

                    used_fadein = this.fade_in;
                    used_fadeout = this.fade_out;

                };

                for (const i of Array(this.n_mics).keys()) {
                    setTimeout(function() {
                        Max.outlet("fad", "mic", i+1, this.wav_mic_play_gain); // fade in of mic
                        Max.outlet("fad", "mic", i+1, 1.0, used_fadeout); // fade in of mic

                        if (i==0){
                            Max.outlet("fad", "wav", i+1, this.sample_wav_gain); // fade out of sample
                            Max.outlet("fad", "wav", i+1, 0.0, used_fadeout); // fade out of sample
                        };
                    }, duration-used_fadeout);
                }


                for (const j of Array(this.n_mics).keys()) {

                    Max.outlet("fad", "mic", j+1, 1.0); // fade out of mic
                    Max.outlet("fad", "mic", j+1, this.wav_mic_play_gain, used_fadein); // fade out of mic
                    
                    if (j==0) {
                        Max.outlet("fad", "wav", j+1, 0.0); // fade in of sample
                        Max.outlet("fad", "wav", j+1, this.sample_wav_gain, used_fadein); // fade in of sample
                    };
                    
                };
                
                Max.outlet("pwav", "bang"); // open sample
            };
            
        };
    };

    play_snippet(snippet_number) {

        const main_and_snippet = snippet_number.split("&")
        const audio_path = this.current_folder + "audio/" + String(main_and_snippet[0]) + "_" + String(main_and_snippet[1]) + "_mic" + String(1) + ".wav";

        // activate the fade ins/outs necessary
        // send play message to each playercm
        getAudioDurationInSeconds(audio_path).then((duration) => {
            
            Max.outlet("win", "play_" + String(duration));
            
            duration = duration*1000
            var used_fadein = 0;
            var used_fadeout = 0;

            if (duration < this.fade_in + this.fade_out) {

                used_fadein = (duration/2) | 0;
                used_fadeout = (duration/2) | 0;

            } else {

                used_fadein = this.fade_in;
                used_fadeout = this.fade_out;

            };

            for (const i of Array(this.n_mics).keys()) {
                setTimeout(function() {
                    Max.outlet("fad", "mic", i+1, this.mic_play_gain); // fade in of mic
                    Max.outlet("fad", "mic", i+1, 1.0, used_fadeout); // fade in of mic
                    Max.outlet("fad", "sample", i+1, this.sample_play_gain); // fade out of sample
                    Max.outlet("fad", "sample", i+1, 0.0, used_fadeout); // fade out of sample
                }, duration-used_fadeout);
            }


            for (const j of Array(this.n_mics).keys()) {
                const sample_to_play = this.current_folder + "audio/" + String(main_and_snippet[0]) + "_" + String(main_and_snippet[1]) + "_mic" + String(j+1) + ".wav";

                Max.outlet("play", j+1, "open", sample_to_play); // open sample
                Max.outlet("fad", "mic", j+1, 1.0); // fade out of mic
                Max.outlet("fad", "mic", j+1, this.mic_play_gain, used_fadein); // fade out of mic
                Max.outlet("fad", "sample", j+1, 0.0); // fade in of sample
                Max.outlet("fad", "sample", j+1, this.sample_play_gain, used_fadein); // fade in of sample
                
            };
            
            for (const k of Array(this.n_mics).keys()) {

                Max.outlet("play", k+1, 1); // open sample
            
            };
                
            
        });
    
    };

    change_from_monitor(max_object, value) {

        const split_value = value.split("&");

        if (split_value[0] == "current") {
            if (msp_objects_state[max_object].type == "perc") { // this is the case for percentage based change
                if (msp_objects_state[max_object].loop == "") {
                    if (split_value[1] == "0") {

                        Max.outlet("in", max_object, "current", "bang");

                    } else {

                        const min_value = msp_objects_state[max_object].umin;
                        const max_value = msp_objects_state[max_object].umax;
                        const current_value = msp_objects_state[max_object].current;

                        const current_perc = range_func(min_value, max_value, 0, 100, current_value);
                        
                        var new_perc = current_perc
                        var new_value = current_value

                        if (split_value[1] == "-1") {

                            new_perc = current_perc + parseInt(split_value[1]);

                            new_value = range_func(0, 100, min_value, max_value, new_perc);

                        } else if(split_value[1] == "1") {

                            new_perc = current_perc + parseInt(split_value[1]);

                            new_value = range_func(0, 100, min_value, max_value, new_perc);

                        };

                        if (parseInt(new_perc) < 0 || parseInt(new_perc) > 100) {
                            new_perc = current_perc
                            new_value = current_value
                        };

                        Max.outlet("in", max_object, "current", new_value);
                    };

                } else {

                    Max.outlet("in", max_object, "current", "bang");

                };
            } else { // this is the case for absolute value change

                if (max_object == "mspwavplay") {
                    
                    if (split_value[1] == "0") {
                        
                        Max.outlet("in", max_object, "gate", 2);
                        Max.outlet("in", max_object, "current", "bang");

                    } else if (split_value[1] != "act") {

                        Max.outlet("in", max_object, "gate", 2);

                        const min_value = msp_objects_state[max_object].min;
                        const max_value = msp_objects_state[max_object].max;
                        const current_value = msp_objects_state[max_object].current;

                        var new_value = current_value

                        if (split_value[1] == "-1") {

                            new_value -= msp_objects_state[max_object].diff;

                        } else if(split_value[1] == "1") {

                            new_value += msp_objects_state[max_object].diff;

                        };

                        if (new_value < min_value || new_value > max_value) {
                            new_value = current_value
                        };

                        Max.outlet("in", max_object, "current", new_value);

                    } else {

                        Max.outlet("in", max_object, "gate", 1);
                        this.play_wav()

                    };

                } else {
                    if (split_value[1] == "0") {
                        
                        Max.outlet("in", max_object, "current", "bang");

                    } else {

                        const min_value = msp_objects_state[max_object].min;
                        const max_value = msp_objects_state[max_object].max;
                        const current_value = msp_objects_state[max_object].current;

                        var new_value = current_value

                        if (split_value[1] == "-1") {

                            new_value -= msp_objects_state[max_object].diff;

                        } else if(split_value[1] == "1") {

                            new_value += msp_objects_state[max_object].diff;

                        };

                        if (new_value < min_value || new_value > max_value) {
                            new_value = current_value
                        };

                        Max.outlet("in", max_object, "current", new_value);
                    };
                };
            };

        } else if (split_value[0] == "umax" || split_value[0] == "umin") {

            if (split_value[1] == "0") {

                // here we check if the last loop didnt put the current value out the limits
                if (msp_objects_state[max_object].loop == "") {

                    const min_value = msp_objects_state[max_object].umin;
                    const max_value = msp_objects_state[max_object].umax;

                    const current_value = msp_objects_state[max_object].current;

                    if (split_value[0] == "umax" && current_value > max_value) {

                        Max.outlet("in", max_object, split_value[0], current_value);

                    } else if (split_value[0] == "umin" && current_value < min_value) {

                        Max.outlet("in", max_object, split_value[0], current_value);

                    } else {

                        Max.outlet("in", max_object, split_value[0], "bang");

                    };

                } else {

                    Max.outlet("in", max_object, split_value[0], "bang");

                };

            } else {

                const min_value = msp_objects_state[max_object].min;
                const max_value = msp_objects_state[max_object].max;

                const current_value = msp_objects_state[max_object][split_value[0]];

                const current_perc = range_func(min_value, max_value, 0, 100, current_value);
                
                var new_perc = current_perc
                var new_value = current_value

                if (split_value[1] == "-1") {

                    new_perc = current_perc + parseInt(split_value[1]);

                    new_value = range_func(0, 100, min_value, max_value, new_perc);

                } else if(split_value[1] == "1") {

                    new_perc = current_perc + parseInt(split_value[1]);

                    new_value = range_func(0, 100, min_value, max_value, new_perc);

                };
                
                if (msp_objects_state[max_object].loop == "") {

                    if (split_value[0] == "umin" && new_value >= msp_objects_state[max_object]["current"]) {

                        new_perc = current_perc
                        new_value = current_value

                    } else if (split_value[0] == "umax" && new_value <= msp_objects_state[max_object]["current"]) {
                        
                        new_perc = current_perc
                        new_value = current_value
                
                    };

                } else {

                    if (split_value[0] == "umin" && new_value >= msp_objects_state[max_object].umax) {

                        new_perc = current_perc
                        new_value = current_value

                    } else if (split_value[0] == "umax" && new_value <= msp_objects_state[max_object].umin) {
                        
                        new_perc = current_perc
                        new_value = current_value
                
                    };

                };

                if (parseInt(new_perc) < 0 || parseInt(new_perc) > 100) {
                    new_perc = current_perc
                    new_value = current_value
                };

                Max.outlet("in", max_object, split_value[0], new_value);

            };

        } else if (split_value[0] == "cycle") {

            if (split_value[1] == "0") {

                Max.outlet("in", max_object, split_value[0], "bang");

            } else {

                const min_value = msp_objects_state[max_object].cmin;
                const max_value = msp_objects_state[max_object].cmax;
                const current_value = msp_objects_state[max_object].cycle;

                const current_perc = range_func(min_value, max_value, 0, 100, current_value);
                
                var new_perc = current_perc;
                var new_value = current_value;

                if (split_value[1] == "-1") {

                    new_perc = current_perc + parseInt(split_value[1]);

                    new_value = range_func(0, 100, min_value, max_value, new_perc);

                } else if(split_value[1] == "1") {

                    new_perc = current_perc + parseInt(split_value[1]);

                    new_value = range_func(0, 100, min_value, max_value, new_perc);

                };

                if (parseInt(new_perc) < 0 || parseInt(new_perc) > 100) {
                    new_perc = current_perc;
                    new_value = current_value;
                };
    
                Max.outlet("in", max_object, "cycle", new_value);

            };
            
        } else if (split_value[0] == "loopr" || split_value[0] == "loopl") {
            
            if (msp_objects_state[max_object].loop != "") { // queremos parar o loop

                Max.outlet("in", max_object, "loop", "state", 0);

            } else { // queremos iniciar o loop

                if (split_value[0] == "loopr") {

                    Max.outlet("in", max_object, "loop", "dir", 1);

                } else {

                    Max.outlet("in", max_object, "loop", "dir", 2);

                };

                Max.outlet("in", max_object, "loop", "state", 1);

            };

        };

    };

    change_to_monitor(args) {

        if (args[1] == "umin" || args[1] == "umax") {

            msp_objects_state[args[0]][args[1]] = parseFloat(args[2]);

            const min_value = msp_objects_state[args[0]].min;
            const max_value = msp_objects_state[args[0]].max;
            const current_value = msp_objects_state[args[0]][args[1]];

            const current_perc = range_func(min_value, max_value, 0, 100, current_value);

            Max.outlet("mon", args[0] + "_" + String(parseInt(current_perc)));


        } else if (args[1] == "current") {
            
            if (msp_objects_state[args[0]].type == "perc") {
                if (msp_objects_state[args[0]].loop == "") {

                    msp_objects_state[args[0]][args[1]] = parseFloat(args[2]);

                    const min_value = msp_objects_state[args[0]].min;
                    const max_value = msp_objects_state[args[0]].max;
                    const current_value = msp_objects_state[args[0]][args[1]];

                    const current_perc = range_func(min_value, max_value, 0, 100, current_value);

                    Max.outlet("mon", args[0] + "_" + String(parseInt(current_perc)));

                } else {
                    
                    msp_objects_state[args[0]].loop = "loop";
                    Max.outlet("mon", args[0] + "_" + "LOOP");    

                };
            } else {
                
                msp_objects_state[args[0]][args[1]] = parseFloat(args[2]);

                Max.outlet("mon", args[0] + "_" + String(parseFloat(args[2])));

            };
    
        } else if (args[1] == "cycle") {

            msp_objects_state[args[0]][args[1]] = parseFloat(args[2]);

            const min_value = msp_objects_state[args[0]].cmin;
            const max_value = msp_objects_state[args[0]].cmax;
            const current_value = msp_objects_state[args[0]][args[1]];

            const current_perc = range_func(min_value, max_value, 0, 100, current_value);

            Max.outlet("mon", args[0] + "_" + String(parseInt(current_perc)));

        } else if (args[1] == "loop") {

            if (args[2] == "state") {

                if (args[3] == 1) {

                    Max.outlet("mon", args[0] + "_" + "LOOP");
                    msp_objects_state[args[0]].loop = "loop";

                } else {

                    msp_objects_state[args[0]].loop = "";
                    Max.outlet("in", args[0], "current", "bang");
                };

            }

        }; 
    };

    output_message(group, message, submessage) {

        if (submessage != "") {

            Max.outlet(group, message, submessage);
            
        } else {

            Max.outlet(group, message);

        };

    };

};

const global_manager = new InformationHandler("");

const handlers = {
    [Max.MESSAGE_TYPES.ALL]: (handled, ...args) => {

        if (args[0] == "wav_dict") {
            
            global_manager.current_waves = args[1]
            
        } else if (args[0] == 'current_path') {
            
            global_manager.base_folder = args[1];

        } else if (args[0] == 'nmics') { 
            
            global_manager.n_mics = parseInt(args[1]);
        
        } else if (args[0] == 'fadein') {

            global_manager.fadein = parseInt(args[1]);

        } else if (args[0] == 'fadeout') {

            global_manager.fadeout = parseInt(args[1]);

        } else if (args[0] == 'play_mic_gain') {
            
            global_manager.mic_play_gain = parseFloat(args[1]);
        
        } else if (args[0] == 'play_wav_mic_gain') {
            
            global_manager.wav_mic_play_gain = parseFloat(args[1]);

        } else if (args[0] == 'play_sample_gain') {
        
            global_manager.sample_play_gain = parseFloat(args[1]);
        
        } else if (args[0] == 'play_wav_gain') {
        
            global_manager.sample_wav_gain = parseFloat(args[1]);
        
        } else if (args[0].includes("msp")) {

            global_manager.change_to_monitor(args);
            
        } else if (args[0] == "tcp") {
            
            if (global_manager.current_folder != "") {
            //decode (I need a method for that)
                data_in = global_manager.decode_input(args[1]);
                
                if (data_in[2] === "win") {

                    if (data_in[0] === "rec") {

                        global_manager.record_snippet(data_in[1]);

                    } else if (data_in[0] === "play") {

                        global_manager.play_snippet(data_in[1]);

                    } else if (data_in[0] === "stop") {

                        global_manager.stop_recording_snippet(data_in[1]);

                    } else if (data_in[0].includes("msp")) {
                    
                       global_manager.change_from_monitor(data_in[0], data_in[1]);
						
                    };
                };
            
            } else {

                Max.post("Alumia_fil: First you need to select a folder!");
            };

        };
        
    }
};

Max.addHandlers(handlers);