#!/usr/bin/env node
import Imap from "imap";
import { config } from "dotenv";

config();

if (!process.argv[2]) {
  console.log("nickname arg missing");
  process.exit(1);
}

const imap = new Imap({
  user: `${process.argv[2] || process.env.DEFAULT_USER}@${process.env.DOMAIN}`,
  password: process.env.PASSWORD,
  host: process.env.IMAP,
  port: 993,
  tls: true,
});

imap.once("ready", () => {
  imap.openBox("INBOX", true, (err) => {
    if (err) throw err;
    imap.seq.search(
      [
        ["FROM", "noreply@discordapp.com"],
        ["SINCE", new Date(Date.now() - 60 * 60 * 1000).toISOString()],
      ],
      (error, uids) => {
        if (error) throw error;
        const [mailId, ...otherMailIds] = uids;
        if (!mailId) {
          console.log("No mail found, exiting.");
          process.exit(1);
        }

        const f = imap.seq.fetch(mailId, {
          bodies: ["HEADER.FIELDS (FROM SUBJECT)", "TEXT"],
        });

        let body, date, from;
        f.on("message", (msg) => {
          msg.on("body", (stream, info) => {
            let buffer = "";

            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });

            stream.once("end", () => {
              if (info.which !== "TEXT") {
                const headers = Imap.parseHeader(buffer);
                from = headers.from[0];
              } else body = buffer;
            });
          });
          msg.once("attributes", (attrs) => (date = attrs.date));
        });
        f.once("error", (err) => {
          console.log("Fetch error: " + err);
        });
        f.once("end", () => {
          const verificationStringIndex =
            body.indexOf("Verify", body.indexOf("Verify") + 1) - 1000;
          const verificationString: string = body.substr(
            verificationStringIndex,
            2000
          );
          const match = verificationString.match(/https:\/\/.*?(?=" )/gms);
          if (match && !match.length) console.log("Regex error");
          console.log(
            "Verification link:",
            match[0].replace(/=\r\n/g, "").replace("?upn=3D", "?upn=")
          );

          imap.end();
        });
      }
    );
  });
});

imap.once("error", (err) => {
  console.log(err);
});

imap.connect();
