autowatcher = 1;

const Max = require("max-api");
const fs = require('fs');

class path_class {
    constructor(base_path, daily_folder, perf_folder, rec_video) {
        this.base_path = base_path;
        this.daily_folder = daily_folder;
        this.perf_folder = perf_folder;
        this.rec_video = rec_video;
    }

    get daily_path() {

        return this.base_path + this.daily_folder + "/";
    }

    get full_path() {

        return this.base_path + this.daily_folder + "/" + this.perf_folder + "/";
    }
};

class necessary_methods extends path_class {

    constructor(new_daily_code, new_perf_code, base_path, daily_folder, perf_folder, rec_video) {

        super(base_path, daily_folder, perf_folder, rec_video);

        this.new_daily_code = new_daily_code;
        this.new_perf_code = new_perf_code;
        this.today_date = this.today_date_getter();

    }

    output_to_list(list_name, items_list) {

        let out_dict = {"items": items_list};

        Max.outlet(list_name, out_dict)

    }

    send_list_clear(list_name) {

        Max.outlet(list_name, "clear");

    }

    check_present_folders(subfolder_type) {

        const regExp = /[a-zA-Z]/g;
        let directories_out = [];

        if (subfolder_type == "daily") {

            var all_directories = fs.readdirSync(this.base_path, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        } else {

            all_directories = fs.readdirSync(this.daily_path, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

        };

        for (const dir of all_directories) {

            if (subfolder_type == "daily") {

                if (!regExp.test(dir) && dir.includes("-")) {

                    directories_out.push(dir);

                };
            } else {

                if (dir.includes("perf")) {
                    
                    directories_out.push(dir);

                };
            };
        };

        return directories_out;

    };

    today_date_getter() {

        const check_datetime = new Date();

        var check_date_month = check_datetime.getMonth() + 1;
        const check_date = check_datetime.getFullYear() + "-" + check_date_month + "-" + check_datetime.getDate();

        return check_date;
    };

    populate_daily_list(base_folder) {

        this.base_path = base_folder;

        var output_list = this.check_present_folders("daily");

        this.send_list_clear("daily");

        if (!fs.existsSync(this.base_path + this.today_date + "/")) {

            output_list.push(this.new_daily_code);

        }

        this.output_to_list("daily", output_list);

    }

    populate_perf_list(message_argument) {

        if (message_argument != this.new_daily_code) {

            this.daily_folder = message_argument;

            this.send_list_clear("perf");

            var output_list = this.check_present_folders("perf");

            output_list.push(this.new_perf_code);
            
            this.output_to_list("perf", output_list);
        
        } else {

            this.daily_folder = this.today_date;

            this.send_list_clear("perf");

            if (!fs.existsSync(this.daily_path)){

                fs.mkdirSync(this.daily_path);

            };

            var output_list = [this.new_perf_code]

            this.output_to_list("perf", output_list);

            this.update_list("daily", this.daily_folder);

        };
        
    }

    select_perf_folder(message_argument) {

        if (message_argument != this.new_perf_code) {

            this.perf_folder = message_argument;
            this.output_path_to_win();
            this.output_full_path_to_max();

            //we will want to check for the latest video in the folder
            //if there is none, it is zero. This means searching for files with .mjpeg termination

        } else {
            
            var output_list = this.check_present_folders("perf");

            if (output_list.length === 0) {

                this.perf_folder = "perf-0";

                if (!fs.existsSync(this.full_path)){

                    fs.mkdirSync(this.full_path);

                };

            } else {

                var max_number = -1;

                for (let existing_folder of output_list) {

                    var tmp_number = existing_folder.split("-").slice(-1)
                    if (parseInt(tmp_number)  > max_number) {
                        
                        max_number = parseInt(tmp_number);

                    };
                };
                
                max_number += 1;
                
                this.perf_folder = "perf-" + max_number;

                if (!fs.existsSync(this.full_path)){

                    fs.mkdirSync(this.full_path);

                };

            };

            this.update_list("perf", this.perf_folder);
            this.output_path_to_win();
            this.output_full_path_to_max();

        };

    };

    update_list(list_type, item_to_add) {

        if (list_type == "daily") {

            var output_list = this.check_present_folders("daily");
            
            if (!output_list.includes(this.daily_folder)) {

                output_list.push(this.daily_folder);

            }

            this.output_to_list("daily", output_list);
            this.set_in_list("daily", this.daily_folder);

        } else {

            var output_list = this.check_present_folders("perf");

            if (!output_list.includes(this.perf_folder)) {

                output_list.push(this.perf_folder);

            }

            output_list.push(this.new_perf_code);

            this.output_to_list("perf", output_list);
            this.set_in_list("perf", this.perf_folder);
        }

    };

    set_in_list(list_type, item_to_set) {

        Max.outlet(list_type, "set", item_to_set);
    }

    output_path_to_win() {

        Max.outlet("win", "current_path", this.daily_folder + "&" + this.perf_folder);

    }

    output_full_path_to_max() {

        Max.outlet("max", "current_path", this.full_path);

    }

};

const global_info = new necessary_methods("NEW folder (today)", "NEW PERFORMANCE", "", "", "", "");

const handlers = {
    [Max.MESSAGE_TYPES.ALL]: (handled, ...args) => {

        if (args[0] == 'base_folder') {
            
            global_info.populate_daily_list(args[1]);

        } else if (args[0] == 'daily_folder' && global_info.base_path != '') {

            global_info.populate_perf_list(args[1]);

        } else if (args[0] == 'perf_folder' && global_info.base_path != '' && global_info.daily_folder != '') {

            global_info.select_perf_folder(args[1]);

        };
        
    }
};

Max.addHandlers(handlers);