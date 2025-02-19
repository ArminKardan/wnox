
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { App } from './libs/bridge';
import fs from 'fs'

// global.wsdebug = true;


(async () => {

    await App.initUDB();

    await App.Connect({ //if process args not available use this
        app: "myapp",
        resource: "default",
        securekey: "3UQXj0OK8FbjG43VsHmYQOuTea81tgCBJQ46ODURXYAFMSQR",
        image: "/files/app/robot.webp",
        public: false,
    })

    console.log("[bridge] connected.")

    nexus.msgreceiver = (specs) => {
        console.log("new message:", specs)
    }

    nexus.subscribe("mychannel")

    // let p = await nexus.api({app:"mypy", cmd:"ping", body:{mydata:10}})
    // console.log("ping result:", p)

    setInterval(() => {
        nexus.sendtochannel("mychannel", "hiii")
    }, 2000);

    App.on("ping", async (specs) => {
        console.log("ping request from:", specs.uid)
        return { code: 0, pong: true }
    })

})()

