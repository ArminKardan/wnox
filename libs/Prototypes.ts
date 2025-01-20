import { ObjectId } from "mongodb";

const crypto = require('crypto');
declare global {
    interface String {
        between(str1: string, str2: string): string
    }

    interface Array<T> {
        includesid(element: T): Array<T>;
        toggle(element: T): Array<T>;
    }

    var nexus: {
        subscribe: (channel:string)=>void,
        unsubscribe: (channel:string)=>void,
        channels:Set<string>,
        msgreceiver: (from:string, body:string)=>void,
        connected:boolean,
        api: (specs: { app: string, cmd: string, body?: any, jid?: string, prioritize_public?: boolean })=> Promise<any>,
        sendtojid: (jid: string, body: string) => Promise<any>,
        sendtochannel: (channel: string, body: string) => Promise<any>,
    }

    function SerialGenerator(len:number):string
    function cdn(url: string): string;
    function api(url: string, data?: any): Promise<any>;
    namespace QSON {
        export function parse(input: string): any;
        export function stringify(input: Object): string;
      }
    var uid: ObjectId
}

global.SerialGenerator = (len:number):string =>{
    var chars = "0123456789ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    var randomstring = '';
    for (var i=0; i<len; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    return randomstring;
}

global.MD5 = (data: string | Buffer) => {
    const hash = crypto.createHash('md5');
    hash.update(data);
    const hashResult = hash.digest('hex');
    return hashResult;
}

global.api = async (url: string, data?: any): Promise<any> => {
    if (data) {
      return await (await fetch(url, { method: "POST", body: JSON.stringify(data) })).json()
    }
    else {
      return await (await fetch(url)).json()
    }
  }

global.QSON = {
    stringify: (obj) => JSON.stringify(obj),
    parse: (str) => JSON.parse(str)
}


if (typeof String.prototype.between === 'undefined') {
    Object.defineProperty(String.prototype, 'between', {
        value: function (startStr, endStr) {
            const startIndex = this.indexOf(startStr) + startStr.length;
            const endIndex = this.indexOf(endStr, startIndex);
            if (startIndex === -1 || endIndex === -1) {
                return null;
            }
            return this.slice(startIndex, endIndex);
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

if (typeof Array.prototype.includesid === 'undefined') {

    Object.defineProperty(Array.prototype, 'includesid', {
        value: function (objid) {
            if (!objid) {
                return false
            }
            return !!this.find(obj => obj.equals(objid))
        }
    });
}

if (typeof Array.prototype.toggle === 'undefined') {
    Object.defineProperty(Array.prototype, 'toggle', {
        value: function (el) {
            const index = this.indexOf(el);
            if (index !== -1) {
                this.splice(index, 1);
            } else {
                this.push(el);
            }
            return this;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}


