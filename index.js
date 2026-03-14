import express from "express"
import * as line from "@line/bot-sdk"
import axios from "axios"
import { createClient } from "@supabase/supabase-js"
import fuse from "fuse.js"
import randomColor from "randomcolor"

const app = express()
const port = process.env.PORT || 8080
//LINE variables
const line_headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN"),
}
const line_config = { channelSecret: Deno.env.get("LINE_CHANNEL_SECRET") }
const line_client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN"),
})
//axios - tally
axios.defaults.headers.post["Content-Type"] = "application/json"
axios.defaults.headers.post["Authorization"] = "Bearer " + Deno.env.get("TALLY_API_KEY")
axios.defaults.headers.delete["Content-Type"] = "application/json"
axios.defaults.headers.delete["Authorization"] = "Bearer " + Deno.env.get("TALLY_API_KEY")
//Supabase variables
const supabase_totac = createClient(Deno.env.get("SUPABASE_TOTAC_URL"), Deno.env.get("SUPABASE_TOTAC_PUBLISHABLE_KEY"))
//other variables
const agenda_day = ["18 March 2026", "19 March 2026", "20 March 2026"]
const agenda_room = ["Room A", "Room B", "Room C", "Room D"]
//
app.listen(port, () => {
    console.log("TOTS server is running")
})

app.use("/letter/activate", express.static("letter"))
app.use("/submit", express.static("submit"))
app.use("/agenda", express.static("agenda"))
app.use("/src", express.static("src"))

app.get("/letter/init", (_, res) => {
    form().then((id) => {
        res.redirect("https://totac-2026.thaiorthotrauma.deno.net/letter/activate?id=" + id)
    }).catch((error) => {
        console.error(error)
        res.sendStatus(500)
    })
})

app.post("/callback", (req, res) => {
    const id = req.query.id
    let body = ""
    req.on("data", chunk => {
        body += chunk.toString()
    })
    req.on("end", () => {
        res.sendStatus(200)
        const { data } = JSON.parse(body)
        const prefix = getOptionAnswer(data.fields[0].options, data.fields[0].value[0])
        const name = data.fields[1].value
        const surname = data.fields[2].value
        const type = getOptionAnswer(data.fields[3].options, data.fields[3].value[0])
        const workplace = data.fields[4].value
        const email = data.fields[5].value
        const object = {
            prefix: prefix,
            name: name,
            surname: surname,
            type: type,
            workplace: workplace,
            email: email,
        }
        const config = {
            headers: {
                "Content-Type": "application/json",
            }
        }
        axios.post("https://script.google.com/macros/s/AKfycbxK-UODM_LLmKkSodYx-UfzdWoILggUyJnF1SwFb31TJEz-ThL8LyMXCm1u9z7aFJng5g/exec", object, config)
            .then(() => {
                deleteForm(id)
            }).catch((error) => {
                console.error(error)
                res.sendStatus(500)
            })
    })
})

app.post("/line", line.middleware(line_config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err)
            res.status(500).end()
        })
})

const handleEvent = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null)
    }
    try {
        await axios.post("https://api.line.me/v2/bot/chat/loading/start",
            { "chatId": event.source.userId },
            { headers: line_headers }
        )
    } catch (error) {
        console.error(error)
    }
    //
    const message = event.message.text.trim().toLowerCase()
    if (message === "coffee") {
        line_client.replyMessage({
            "replyToken": event.replyToken,
            "messages": [
                {
                    "type": "flex",
                    "altText": "คาเฟ่",
                    "contents": coffee_object
                }
            ]
        })
    } else if (message === "bakery") {
        line_client.replyMessage({
            "replyToken": event.replyToken,
            "messages": [
                {
                    "type": "flex",
                    "altText": "เบเกอรี่",
                    "contents": bakery_object
                }
            ]
        })
    } else if (message === "search") {
        line_client.replyMessage({
            "replyToken": event.replyToken,
            "messages": [
                {
                    "type": "flex",
                    "altText": "วิธีการค้นหา",
                    "contents": {
                        "type": "bubble",
                        "size": "giga",
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "image",
                                    "url": "https://totac-2026.thaiorthotrauma.deno.net/src/search.png",
                                    "size": "full",
                                    "aspectMode": "fit",
                                    "aspectRatio": "1:1",
                                    "gravity": "center"
                                }
                            ],
                            "paddingAll": "0px"
                        }
                    }
                }
            ]
        })
    } else if (message === "letter") {
        line_client.replyMessage({
            "replyToken": event.replyToken,
            "messages": [
                {
                    "type": "text",
                    "text": "บริการนี้ยังไม่เปิดใช้งาน"
                }
            ]
        })
    } else if (message.startsWith("#")) {
        const results = JSON.stringify(await searchKeyword(message.substring(1).trim()))
        line_client.replyMessage({
            "replyToken": event.replyToken,
            "messages": JSON.parse(results)
        })
    }
}

const coffee_object =
{
    "type": "carousel",
    "contents": [
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/10QQqWaT6X-FeQ-B_sEWOswBCWqTKuew-",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "เสือทิม คาเฟ่",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. พิชัยสงคราม",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0958395433",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0958395433"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/QHnCnAtX2aVLq2at9"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1nQzXM8EsTl7Aq2qzGybUAe7gLiybiCiC",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Blue Craft Cafe",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. ศรีธรรมไตรปิฎก",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0900603045",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0900603045"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/k3194dwCoeKfR7hM7"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1fYhsJRLKHpsw700ysxkTkV6xUJn_II8T",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Hope Coffee",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. ศรีธรรมไตรปิฎก",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0888173785",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0888173785"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/rdpRiaLzcyXs6KuC8"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1Wtl6F2KlScn4uEDxOHOdFVSSwTbM1FcR",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Layers Cafe",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. วิสุทธิกษัตริย์",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0903239869",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0903239869"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/FdrfpoXRAe6qcg337"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1dGKsn7bwOlZxXjPr5mWfCbcApD0nqVCU",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "Tasteture",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. ศรีธรรมไตรปิฎก",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0972818643",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0972818643"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/SLNZYpapBs1EJ85LA"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1eUgiXsWoAHtqwjS7_KdTSEgxX_o3sHQa",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "The Key Cafe",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. สิงหวัฒน์",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0613479988",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0972818643"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/RBHUGkVvEz2QayWA8"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        }
    ]
}

const bakery_object =
{
    "type": "carousel",
    "contents": [
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1QSOyzKL_8owYpDgP-O2nZJgr-bnRedNL",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "กรี่ กะหรี่ปั๊บ",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. นเรศวร",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0818877579",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0818877579"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/8RKe4fPH8Hwf6KNq5"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1f3iqUFQUy34c-C1B_i5Tlu1pBnLVAGef",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "ขนมต้มวัดใหญ่",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ซ. เอกาทศรถ",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0956649916",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0956649916"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/8VjbhYXNrKMXicAs6"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/12NcOkeOMLWmL91WcFBlDcGdgSaNaVrXQ",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "ทับทิมกรอบสามหนุ่ม",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. พระยาจักรี",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0986962369",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0986962369"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/tgPjtT9huZJw6mD2A"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/10qdZMZjWcSjN6a156LMHmrYEClHknqow",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "ปังกลม นมเพียว",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. พระร่วง",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0846888824",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0846888824"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/3kwLXp49fVsec3zK6"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1JPWtCbCH3OmIdmD4liR-k1Ii2bz3w4QG",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "สุนิสา กล้วยตาก",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ศูนย์รวมของฝาก วัดใหญ่",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0815341504",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0815341504"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/P8pgPRKJ1rHEnPfw9"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        },
        {
            "type": "bubble",
            "size": "hecto",
            "hero": {
                "type": "image",
                "url": "https://lh3.googleusercontent.com/d/1ojDg8acD10FHigl3oNipfCyhXiIbv6O2",
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "1.5:1"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "ไอศครีมครูกุ้ง",
                        "align": "center",
                        "size": "lg",
                        "weight": "bold",
                        "style": "italic",
                        "offsetBottom": "sm"
                    },
                    {
                        "type": "separator",
                        "margin": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "ถ. บรมไตรโลกนารถ",
                                "align": "center"
                            },
                            {
                                "type": "text",
                                "text": "0815333066",
                                "align": "center",
                                "action": {
                                    "type": "uri",
                                    "label": "action",
                                    "uri": "tel:0972818643"
                                },
                                "color": "#1f4591",
                                "offsetTop": "sm"
                            }
                        ],
                        "offsetTop": "md",
                        "offsetBottom": "none"
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "google maps",
                                    "uri": "https://maps.app.goo.gl/VKNWuG1rX5nTUonW6"
                                },
                                "margin": "none",
                                "height": "sm",
                                "offsetTop": "md"
                            }
                        ],
                        "offsetTop": "sm"
                    }
                ],
                "offsetBottom": "none"
            }
        }
    ]
}
const form = async () => {
    const id = await createForm()
    await addWebhook(id)
    return id
}
const createForm = async () => {
    try {
        const groupUuid_prefix = crypto.randomUUID()
        const groupUuid_workplaceType = crypto.randomUUID()
        const { data } = await axios.post("https://api.tally.so/forms", {
            name: "totac2026 - letter",
            status: "PUBLISHED",
            settings: {
                redirectOnCompletion: {
                    safeHTMLSchema: [
                        [
                            "https://totac-2026.thaiorthotrauma.deno.net/submit"
                        ]
                    ],
                    mentions: []
                },
                styles: {
                    theme: "CUSTOM",
                    color: {
                        background: "#eef2ff",
                        text: "#241e4e",
                        accent: "#0070D7",
                        buttonBackground: "#241e4e",
                        buttonText: "#FFFFFF"
                    },
                    font: {
                        provider: "Google",
                        family: "Google Sans"
                    }
                },
            },
            blocks: [
                {
                    uuid: crypto.randomUUID(),
                    type: "FORM_TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "TEXT",
                    payload: {
                        cover: "https://storage.tally.so/3524c5a7-abf6-4944-b817-55741b363fbb/Untitled-design.png",
                        safeHTMLSchema: [
                            [
                                "กรุณากรอกข้อมูล"
                            ]
                        ],
                        title: "กรุณากรอกข้อมูล"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "คำนำหน้า"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_prefix,
                    groupType: "DROPDOWN",
                    payload: {
                        index: 0,
                        isRequired: true,
                        isFirst: true,
                        isLast: false,
                        text: "น.พ."
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_prefix,
                    groupType: "DROPDOWN",
                    payload: {
                        isRequired: true,
                        index: 1,
                        isFirst: false,
                        isLast: false,
                        text: "พ.ญ."
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_prefix,
                    groupType: "DROPDOWN",
                    payload: {
                        isRequired: true,
                        index: 2,
                        isFirst: false,
                        isLast: false,
                        text: "นาย"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_prefix,
                    groupType: "DROPDOWN",
                    payload: {
                        isRequired: true,
                        index: 3,
                        isFirst: false,
                        isLast: false,
                        text: "นาง"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_prefix,
                    groupType: "DROPDOWN",
                    payload: {
                        isRequired: true,
                        index: 4,
                        isFirst: false,
                        isLast: true,
                        text: "นางสาว"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "ชื่อ (พิมพ์แค่ชื่อ)"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "INPUT_TEXT",
                    groupUuid: crypto.randomUUID(),
                    groupType: "INPUT_TEXT",
                    payload: {
                        isRequired: true,
                        placeholder: ""
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "นามสกุล (พิมพ์แค่นามสกุล)"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "INPUT_TEXT",
                    groupUuid: crypto.randomUUID(),
                    groupType: "INPUT_TEXT",
                    payload: {
                        isRequired: true,
                        placeholder: ""
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "ประเภทสถานที่ทำงาน"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_workplaceType,
                    groupType: "DROPDOWN",
                    payload: {
                        index: 0,
                        isRequired: true,
                        isFirst: true,
                        isLast: false,
                        text: "โรงพยาบาล **ในสังกัด** มหาวิทยาลัย"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DROPDOWN_OPTION",
                    groupUuid: groupUuid_workplaceType,
                    groupType: "DROPDOWN",
                    payload: {
                        isRequired: true,
                        index: 1,
                        isFirst: false,
                        isLast: true,
                        text: "โรงพยาบาลที่ **ไม่อยู่สังกัด** มหาวิทยาลัย"
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "DIVIDER",
                    groupUuid: crypto.randomUUID(),
                    groupType: "DIVIDER",
                    payload: {}
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TEXT",
                    groupUuid: crypto.randomUUID(),
                    groupType: "DIVIDER",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "วิธีการพิมพ์ชื่อสถานที่ทำงาน",
                                [
                                    [
                                        "tag",
                                        "span"
                                    ],
                                    [
                                        "font-weight",
                                        "bold"
                                    ]
                                ]
                            ],
                            [
                                "\n\n   # "
                            ],
                            [
                                "กรณี",
                                [
                                    [
                                        "tag",
                                        "span"
                                    ],
                                    [
                                        "background-color",
                                        "rgb(255, 225, 72)"
                                    ]
                                ]
                            ],
                            [
                                " โรงพยาบาลในสังกัดมหาวิทยาลัย\n   พิมพ์ชื่อเต็มตามด้วยสังกัด เช่น คณะแพทยศาสตร์วชิรพยาบาล มหาวิทยาลัยนวมินทราธิราช\n\n   # "
                            ],
                            [
                                "กรณี",
                                [
                                    [
                                        "tag",
                                        "span"
                                    ],
                                    [
                                        "background-color",
                                        "rgb(255, 225, 72)"
                                    ]
                                ]
                            ],
                            [
                                " โรงพยาบาลอื่น ๆ ( โรงพยาบาลศูนย์ , โรงพยาบาลทั่วไป , โรงพยาบาลเอกชน ... )\n   พิมพ์คำว่า \"โรงพยาบาล\" นำหน้าชื่อ  เช่น  โรงพยาบาลพุทธชินราช"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "ชื่อสถานที่ทำงาน"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "INPUT_TEXT",
                    groupUuid: crypto.randomUUID(),
                    groupType: "INPUT_TEXT",
                    payload: {
                        isRequired: true,
                        placeholder: ""
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "TITLE",
                    groupUuid: crypto.randomUUID(),
                    groupType: "QUESTION",
                    payload: {
                        safeHTMLSchema: [
                            [
                                "E-mail สำหรับจัดส่งไฟล์"
                            ]
                        ]
                    }
                },
                {
                    uuid: crypto.randomUUID(),
                    type: "INPUT_EMAIL",
                    groupUuid: crypto.randomUUID(),
                    groupType: "INPUT_EMAIL",
                    payload: {
                        isRequired: true,
                        placeholder: ""
                    }
                }
            ]
        })
        return data.id
    } catch (error) {
        console.error(error)
    }
}
const addWebhook = async (id) => {
    try {
        await axios.post("https://api.tally.so/webhooks", {
            formId: id,
            url: "https://totac-2026.thaiorthotrauma.deno.net/callback?id=" + id,
            eventTypes: ["FORM_RESPONSE"]
        })
    } catch (error) {
        console.error(error)
    }
}
const deleteForm = async (id) => {
    try {
        await axios.delete("https://api.tally.so/forms/" + id)
    } catch (error) {
        console.error(error)
    }
}
const getOptionAnswer = (options, value) => {
    for (const o of options) {
        if (o.id === value) {
            return o.text
        }
    }
}
const searchKeyword = async (keyword) => {
    const { data } = await supabase_totac.from("agenda").select()
    const fuseOptions = {
        isCaseSensitive: false,
        ignoreLocation: true,
        threshold: 0.2,
        keys: [
            "section",
            "topic",
            "name_en",
            "name_th"
        ]
    }
    const search_array = (new fuse(data, fuseOptions)).search(keyword)
    let return_array = [
        {
            "type": "text",
            "text": "Found " + search_array.length + " results"
        }
    ]
    let object_array = []
    for (const r of search_array) {
        const color = randomColor()
        let results = [data[r.refIndex].name_en, data[r.refIndex].name_th, data[r.refIndex].type, data[r.refIndex].section, data[r.refIndex].topic, agenda_day[data[r.refIndex].day] + ", " + data[r.refIndex].start.slice(0, -3) + " - " + data[r.refIndex].end.slice(0, -3), agenda_room[data[r.refIndex].room]]
        results = results.map((x) => {
            if (x === null || x === undefined || x === "") {
                return "-"
            } else {
                return x
            }
        })
        const object_sub = {
            "type": "box",
            "layout": "vertical",
            "paddingStart": "xl",
            "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [],
                    "height": "4px",
                    "backgroundColor": "#555555"
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [],
                    "height": "10px",
                    "backgroundColor": color
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "paddingStart": "xl",
                    "paddingEnd": "xl",
                    "contents": [
                        {
                            "type": "text",
                            "text": "Name",
                            "color": "#555555",
                            "size": "md",
                            "weight": "bold",
                            "margin": "xl",
                        },
                        {
                            "type": "text",
                            "text": results[0],
                            "size": "md",
                            "color": "#555555",
                            "margin": "sm",
                            "wrap": true
                        },
                        {
                            "type": "text",
                            "text": results[1],
                            "color": "#555555",
                            "size": "md",
                            "wrap": true
                        },
                        {
                            "type": "text",
                            "text": "(" + results[2] + ")",
                            "color": "#555555",
                            "size": "md",
                            "wrap": true
                        },
                        {
                            "type": "text",
                            "text": "section",
                            "color": "#555555",
                            "size": "md",
                            "weight": "bold",
                            "margin": "lg",
                        },
                        {
                            "type": "text",
                            "text": results[3],
                            "color": "#555555",
                            "size": "md",
                            "margin": "sm",
                            "wrap": true
                        },
                        {
                            "type": "text",
                            "text": "topic",
                            "color": "#555555",
                            "size": "md",
                            "weight": "bold",
                            "margin": "lg",
                        },
                        {
                            "type": "text",
                            "text": results[4],
                            "color": "#555555",
                            "size": "md",
                            "margin": "sm",
                            "wrap": true,
                        },
                        {
                            "type": "text",
                            "text": "date & time",
                            "color": "#555555",
                            "size": "md",
                            "weight": "bold",
                            "margin": "lg",
                        },
                        {
                            "type": "text",
                            "text": results[5],
                            "color": "#555555",
                            "size": "md",
                            "margin": "sm",
                        },
                        {
                            "type": "text",
                            "text": "avenue",
                            "color": "#555555",
                            "size": "md",
                            "weight": "bold",
                            "margin": "lg",
                        },
                        {
                            "type": "text",
                            "text": results[6],
                            "color": "#555555",
                            "size": "md",
                            "margin": "sm",
                        }
                    ]
                },
                {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [],
                    "height": "10px",
                    "backgroundColor": color,
                    "margin": "xxl"
                }
            ]
        }
        object_array.push(object_sub)
    }
    object_array.push({
        "type": "box",
        "layout": "vertical",
        "contents": [],
        "height": "4px",
        "backgroundColor": "#555555",
        "offsetStart": "xl",
    })
    const object_main = {
        "type": "flex",
        "altText": "ผลการค้นหา",
        "contents": {
            "type": "bubble",
            "size": "mega",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": object_array,
                "paddingAll": "none",
                "backgroundColor": "#fafafa"
            }
        }
    }
    return_array.push(object_main)
    return return_array
}