#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var imap_1 = __importDefault(require("imap"));
if (!process.argv[2]) {
    console.log("nickname arg missing");
    process.exit(1);
}
var imap = new imap_1.default({
    user: process.argv[2] + "@laisha.pl",
    password: "ticklypicklY",
    host: "serwer2025710.home.pl",
    port: 993,
    tls: true,
});
imap.once("ready", function () {
    imap.openBox("INBOX", true, function (err) {
        if (err)
            throw err;
        imap.seq.search([
            ["FROM", "noreply@discordapp.com"],
            ["SINCE", new Date(Date.now() - 60 * 60 * 1000)],
        ], function (error, uids) {
            if (error)
                throw error;
            var mailId = uids[0], otherMailIds = uids.slice(1);
            if (!mailId) {
                console.log("No mail found, exiting.");
            }
            var f = imap.seq.fetch(mailId, {
                bodies: ["HEADER.FIELDS (FROM SUBJECT)", "TEXT"],
            });
            var body, date, from;
            f.on("message", function (msg) {
                msg.on("body", function (stream, info) {
                    var buffer = "";
                    stream.on("data", function (chunk) {
                        buffer += chunk.toString("utf8");
                    });
                    stream.once("end", function () {
                        if (info.which !== "TEXT") {
                            var headers = imap_1.default.parseHeader(buffer);
                            from = headers.from[0];
                        }
                        else
                            body = buffer;
                    });
                });
                msg.once("attributes", function (attrs) { return (date = attrs.date); });
            });
            f.once("error", function (err) {
                console.log("Fetch error: " + err);
            });
            f.once("end", function () {
                var verificationStringIndex = body.indexOf("Verify", body.indexOf("Verify") + 1) - 1000;
                var verificationString = body.substr(verificationStringIndex, 2000);
                var match = verificationString.match(/https:\/\/.*?(?=" )/gms);
                if (match && !match.length)
                    console.log("Regex error");
                console.log("Verification link:", match[0].replace(/=\r\n/g, "").replace("?upn=3D", "?upn="));
                imap.end();
            });
        });
    });
});
imap.once("error", function (err) {
    console.log(err);
});
imap.connect();
//# sourceMappingURL=index.js.map