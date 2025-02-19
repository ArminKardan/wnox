import fs from 'fs';
import readline from 'readline'
import kleur from 'kleur';
import path from 'path';
import figlet from 'figlet';
import "./Prototypes"
const { client, xml } = require("./xmpp.min.js");
import { MongoClient, ObjectId } from 'mongodb'

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
declare global { var udb: import("mongodb").Db; }
declare global {
    function sleep(ms): Promise<any>
}

global.sleep = (ms) => {
    return new Promise(r => setTimeout(() => r(null), ms))
}

export namespace App {
    let c: {
        app: string,
        resource: string,
        securekey: string,
        image?: string,
        public?: boolean,
    };

    const Declareglobals = () => {
        global.xmppapicb = {}

        global.nexus = {
            subscribe: async (channel: string) => {
                console.log("subscribing to:", `${channel + "@conference.qepal.com"}/${c.app + "-" + global.uid.toString() + "-" + c.resource}`)
                await global.xmpp.send(global.xmppxml(
                    'presence',
                    { to: `${channel + "@conference.qepal.com"}/${c.app + "-" + global.uid.toString() + "-" + c.resource}` },
                ));
                global.nexus.channels.add(channel)
                return 0
            },
            unsubscribe: async (channel: string) => {
                global.xmpp.send(global.xmppxml(
                    'presence',
                    {
                        to: `${channel + "@conference.qepal.com"}`,
                        type: 'unavailable'
                    }
                ));
            },
            channels: new Set(),
            msgreceiver: () => { },
            connected: false,
            api: async (specs: { app: string, cmd: string, body: any, jid?: string, prioritize_public: boolean }) => {
                let jid = specs.jid
                if (!jid) {
                    let json = await api("https://qepal.com/api/bridge/worker/findfreeresource", { app: specs.app, securekey: c.securekey })
                    let jids = json.jids
                    if (jids.length > 0) {
                        jid = !specs.prioritize_public ? jids[0] : jids.at(-1);
                    }
                }

                if (!jid) {
                    return { error: "no worker found" }
                }

                console.log("QE JID:", jid, "APP:", specs.app)


                return new Promise(async resolve => {
                    let mid = SerialGenerator(10)

                    let msg = JSON.stringify({
                        mid,
                        api: specs.cmd,
                        ...(specs.body || {}),
                    })
                    let c = setTimeout(() => {
                        resolve({ error: "timeout" })
                    }, 30 * 1000);

                    global.xmppapicb[mid] = {
                        mid,
                        cb: (ob) => { clearTimeout(c); resolve(ob); }
                    }

                    await global.xmpp.send(global.xmppxml(
                        "message",
                        { to: jid, type: "chat" }, // type: "chat" for one-to-one messages
                        global.xmppxml("body", {}, msg,
                        )))
                })

            },
            sendtojid: async (jid: string, body: string) => {
                await global.xmpp.send(global.xmppxml(
                    "message",
                    { to: jid, type: "chat" }, // type: "chat" for one-to-one messages
                    global.xmppxml("body", {}, body,
                    )))
            },
            sendtochannel: async (channel: string, body: string) => {
                let subs = global.nexus.channels as Set<string>
                if (!subs.has(channel)) {

                    await global.nexus.subscribe(channel);
                    await sleep(500)
                }
                await global.xmpp.send(global.xmppxml(
                    "message",
                    {
                        to: `${channel}@conference.qepal.com`,
                        from: `${c.app + "-" + global.uid.toString()}@qepal.com/${c.resource}`,
                        type: "groupchat"
                    },
                    global.xmppxml("body", {}, body,
                    )))
            },
        }


    }

    let Events: Array<{ api: string, cb: (specs: { body: any, uid: string | null, app: string | null, resource: string | null }) => any }> = [];

    export function on(api: string, cb: (specs: { body: any, uid: string | null, app: string | null, resource: string | null }) => any) {
        Events.push({ api, cb })
    }
    export async function initUDB() {
        if (process.env.UMONGOURL) {
            try {
                var uclient = new MongoClient(process.env.UMONGOURL)
                let umongo = await uclient.connect()
                global.udb = umongo.db(process.env.UMONGODB_DB)
                await uclient.db().command({ ping: 1 });
                console.log("✅ mongo-udb successfully connected.");
            } catch {
                console.error("❌ mongo-udb connection failed.")
            }
        }
    }
    export async function Connect(config: {
        app: string,
        resource: string,
        securekey: string,
        public?: boolean,
        image?: string,
    }): Promise<{
        app: string,
        resource: string,
        securekey: string,
        image?: string,
        public?: boolean,
    }> {


        if (config.app.includes("-")) {
            throw "App name should not contains dash '-'."
        }
        else if (config.resource.includes("-")) {
            throw "Resoiurce name should not contains dash '-'."
        }

        let json = await (await fetch("https://qepal.com/api/bridge/worker/init", {
            method: "POST",
            headers: {
                // 'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app: config.app,
                resource: config.resource,
                securekey: config.securekey,
                image: config.image,
                public: config.public
            })
        })).json()

        global.uid = new ObjectId(json.uid)
        global.myjid = config.app + "-" + global.uid.toString() + "@qepal.com/" + config.resource

        // const chalk = (await import('chalk')).default
        // const chalk = (await require('chalk')).default
        c = config;
        let rl = readline.createInterface(process.stdin, process.stdout);
        let entered = false;
        if (config.securekey == null) {
            if (fs.existsSync("./files/config.json")) {
                let json = JSON.parse(fs.readFileSync("./files/config.json", 'utf8'))
                config.securekey = json.securekey;
                config.resource = json.resource;
                config.app = json.app
                config.image = json.image
            }
            else {
                while (true) {
                    config.securekey = ((await new Promise(r => rl.question('Enter your securekey: ', (t) => r(t)))) as string).trim()
                    if (config.securekey?.length != 48) {
                        console.log(kleur.red("Secure key is not in correct format, please try again... \n\n"))
                    }
                    else {
                        break;
                    }
                }

                if (!config.resource || config.resource?.length == 0) {
                    config.resource = "default";
                }
                config.resource = ((await new Promise(r => {
                    rl.question('Enter your desired resource: ', (t) => r(t.trim()))
                    rl.write(config.resource);
                })));
                entered = true;
            }
        }
        if (!config.securekey) {
            console.log("Secure key did not entered correctly.")
            await new Promise(r => rl.question(', press any key to exit...', (t) => r(t)))
            process.exit(0)
        }
        else if (entered) {
            if (!fs.existsSync("./files")) {
                fs.mkdirSync("./files")
            }
            fs.writeFileSync("./files/config.json",
                JSON.stringify({ image: config.image, app: config.app, securekey: config.securekey, resource: config.resource, public: config.public }, null, 2))
            console.log("credentials saved successfully.")
        }

        if (global.wsdebug) console.log("Connect function calling...")

        for (let i = 2; i < process.argv.length; i++) {
            const [key, value] = process.argv[i].split('=');
            if (c.hasOwnProperty(key)) {
                if (value === 'null') {
                    c[key] = null;
                } else if (!isNaN(Number(value))) {
                    c[key] = Number(value);
                } else if (value === 'true' || value === 'false') {
                    c[key] = value === 'true';
                } else if (value.startsWith('[') && value.endsWith(']')) {
                    c[key] = JSON.parse(value);
                } else {
                    c[key] = value;
                }
            }
        }



        return await new Promise<any>(async r => {

            const xmpp = client({
                service: "wss://bridge.qepal.com/ws",
                domain: "qepal.com",
                resource: json.resource,
                username: json.user,
                password: json.password,
            });

            global.xmpp = xmpp
            global.xmppxml = xml
            global.xmppclient = client

            Declareglobals()

            let isReconnecting = false; // Flag to track reconnection attempts

            function reconnect() {
                if (isReconnecting) {
                    if (global.wsdebug)
                        console.log('Reconnection already in progress. Skipping...');
                    return;
                }
                if (global.wsdebug)
                    console.log('Attempting to reconnect...');
                isReconnecting = true;
                xmpp.stop().then(() => {
                    xmpp.start().catch((err) => {
                        if (global.wsdebug)
                            console.error('Reconnection failed:', err.message);
                        setTimeout(reconnect, 5000);
                    });
                }).catch((err) => {
                    if (global.wsdebug)
                        console.error('Failed to stop XMPP client:', err.message);
                    setTimeout(reconnect, 5000);
                }).finally(() => {
                    isReconnecting = false;
                });
            }

            xmpp.on('error', (err) => {
                if (err.message.includes('network error') || err.message.includes('non-101 status code')) {
                    reconnect();
                }
            });

            xmpp.on('offline', () => {
                reconnect();
            });

            xmpp.on('stanza', async (stanza) => {
                if (stanza.is("message")) {
                    const body = stanza.getChildText("body");
                    const from = stanza.attrs.from;
                    const itsme = (from as string).includes(c.app + "-" + global.uid.toString() + "-" + c.resource)
                    const itsbro = !itsme && (from as string).includes(c.app + "-" + global.uid.toString())
                    if (body && !stanza.getChild('delay')) {

                        if (body.startsWith("{")) {
                            try {
                                let json = JSON.parse(body);
                                if (json.api && !from.includes("@conference.qepal.com")) {
                                    let found = false
                                    for (let ev of Events) {
                                        if (ev.api == json.api) {
                                            let { api, mid, ...data } = json
                                            let uid = null
                                            let resource = null
                                            let app = null

                                            let ___useruid = from.split("@")[0]
                                            if (___useruid.length == 24 && ObjectId.isValid(___useruid)) {
                                                uid = ___useruid
                                            }
                                            else if (___useruid.includes("-")) {
                                                let ss = ___useruid.split("-")
                                                if (ss.length == 2) {
                                                    app = ss[0]
                                                    uid = ss[1].length == 24 && ObjectId.isValid(ss[1]) ? ss[1] : null
                                                    resource = from.split("@qepal.com/")[1]
                                                }
                                            }

                                            let res = await ev.cb({ uid, app, resource, body: data })
                                            await xmpp.send(xml(
                                                "message",
                                                { to: from, type: "chat" }, // type: "chat" for one-to-one messages
                                                xml("body", {}, JSON.stringify({ ...res, mid: json.mid, }),
                                                )))
                                            found = true
                                        }

                                    }
                                    if (found) { return }


                                }
                                else if (json.mid && global.xmppapicb[json.mid]) {
                                    let mid = json.mid
                                    delete json.mid
                                    global.xmppapicb[mid].cb(json)
                                    return
                                }
                            }
                            catch { }
                        }

                        {
                            let channel = null
                            let uid = null
                            let resource = null
                            let app = null

                            if (from.includes("@conference.qepal.com")) {
                                channel = from.split("@conference.qepal.com")[0]
                                let rest = from.split("@conference.qepal.com")[1]
                                let rests = rest.split("-")
                                if (rests.length == 2) {
                                    if (rests[0].length == 24 && ObjectId.isValid(rests[0])) {
                                        uid = rests[0]
                                        resource = rests[1]
                                    }
                                }
                                else if (rests.length == 3) {
                                    if (rests[1].length == 24 && ObjectId.isValid(rests[1])) {
                                        app = rests[0]
                                        uid = rests[1]
                                        resource = rests[2]
                                    }
                                }
                            }
                            else if (from.includes("@qepal.com")) {
                                let ss = from.split("@qepal.com")
                                if (ss.length == 2) {
                                    if (ss[0].length == 24 && ObjectId.isValid(ss[0])) {
                                        uid = ss[0]
                                    }
                                    else if (ss[0].split("-").length == 2) {
                                        let sss = ss[0].split("-")
                                        if (sss[1].length == 24 && ObjectId.isValid(sss[1])) {
                                            uid = sss[1]
                                            app = sss[0]
                                            resource = from.split("@qepal.com")[1]
                                        }
                                    }
                                }
                            }
                            global.nexus.msgreceiver({ from, body, channel, app, uid, resource, itsme, itsbro })
                        }

                    }

                }
            });

            xmpp.on('online', async (address) => {
                xmpp.send(xml("presence"));
                r(c)
            });

            xmpp.start().catch((err) => {
                reconnect();
            });

            process.on('uncaughtException', (err) => { });
            process.on('unhandledRejection', (err) => { });
            process.on('exit', async () => {
                if (global.wsdebug)
                    console.log("exiting...")
                xmpp.stop().catch((err) => { });
            });



        })
    }

    export const Figlet = (text): string => {
        let data = fs.readFileSync(path.join(process.cwd(), "./files/Big.flf"), "utf8");
        figlet.parseFont("Bigger", data);
        return figlet.textSync(text, "Bigger" as any)
    }
}

