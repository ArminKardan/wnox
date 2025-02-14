
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { App } from './libs/bridge';
import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'

declare global { var db: import("mongodb").Db; }

// global.wsdebug = true;

(async () => {

    let c = await App.Connect({ //if process args not available use this
        app: "myapp",
        resource: "default",
        securekey: "",
        image: "/files/app/robot.webp",
        public: true,
    })

    console.log("[bridge] connected.")

    nexus.msgreceiver = (specs) => {
        if (specs.itsme) {
            console.log("msg from me:", specs.body)
        }
        else if (specs.itsbro) {
            console.log("msg from bro:", specs.body)
        }
        else {
            console.log("msg from:", specs.from, specs.body)
        }
    }

    nexus.subscribe("mychannel")

    setInterval(() => {
        nexus.sendtochannel("mychannel", "hiii")
    }, 2000);

    App.on("ping", async (json, uid, isapp) => {
        console.log("ping request from:", uid)
        return { code: 0, pong: true }
    })

})()

