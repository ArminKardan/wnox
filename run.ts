
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { App } from './libs/bridge';
import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'

declare global { var db: import("mongodb").Db; }


(async () => {

    await App.Connect({ //if process args not available use this
        app: "mailer",
        resource: "default",
        securekey: "ev2uF1TbAhONGZuvGkKzVYLVbU2QbjMY5sOB9tyrODHXNs3r",
        image: "/files/email.webp",
        public: true,
    })

    console.log("[bridge] connected.")

    nexus.msgreceiver = (from, body)=>{
        console.log(from, body)
    }

    nexus.subscribe("mychannel")

    setInterval(() => {
        nexus.sendtochannel("mychannel","hiii")
    }, 2000);

    App.on("ping", async (json, uid, isapp) => {
        console.log("ping request from:", uid)
        return { code: 0, pong: true }
    })

})()

