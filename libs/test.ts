import fs from 'fs'
import puppeteer from 'puppeteer'
import path from 'path'
import readline from 'readline'

export const BrowserApp = async () => {
    let rl = readline.createInterface(process.stdin, process.stdout);
    let chalk = await (await import("chalk")).default

    if(!fs.existsSync("C:\\QE\\chrome\\chrome.exe"))
    {
        console.log(chalk.red("Error: No QE chrome found!\nplease install it first from: https://irmapserver.ir/download/setup-chrome.rar"))
        await new Promise(r => rl.question(', press any key to exit...', (t) => r(t)))
        process.exit(0)
    }
    var browser = await puppeteer.launch({
        headless: false,
        // args:["--headless=old"],
        executablePath: "C:\\QE\\chrome\\chrome.exe"
      });


  let rands = ["translate", 'translator', 'translation', 'translater', 'translat', 'translators', 'translatordeepl', 'translatorgoogle']
  let url = rands[Math.floor(Math.random() * 8)]

  let page = await browser.newPage();
  await page.setViewport({
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
  });

//   await page.setRequestInterception(true);
//   let r = await new Promise(async r => {
//     try {
//       page.on('request', request => {
//         if (request.url().includes("vqd=")) {
//           r({ vqd: betweenxy(request.url(), "vqd=", "&"), query: url })
//         }
//         request.continue();
//       });

//       await page.goto("https://duckduckgo.com/?q=" + url)
//     } catch { r({}) }
//   })

  page.waitForNavigation().then(() => {
    setTimeout(() => {
      try { browser.close(); } catch { }
    }, 3000);
  });
}

var betweenxy = (value, start, end) => {
  var text = value
  var st = text.indexOf(start) + start.length
  var text = text.substring(st);
  var en = text.indexOf(end)
  var text = text.substring(0, en);
  return text
}