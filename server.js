const express = require("express")
const app = express()
const axios = require("axios")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const uuid = require("uuid")
const config = require("./config.json")
let sessions = new Map()

app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))
app.use(cors({credentials:true}))
app.listen(3000)
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs")
app.get("/", (req, res) => {
    if(!sessions.has(req.cookies.sessionId)) {
        return res.render("index")
    } else {
        return res.redirect("/home")
    }
    
})


app.get("/redirect", (req, res) => {
    axios.post('https://discord.com/api/v10/oauth2/token', 
    
    {
            'client_id': config.client_id,
            'client_secret': config.client_secret,
            'grant_type': 'authorization_code',
            'code': req.query.code,
            'redirect_uri': config.redirect_uri,
            'scope': 'identify'
          },
         {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            "Accept-Encoding": "gzip,deflate,compress"
         }
            
          }
    ).then(r => {
        let id_gen = uuid.v4()
    
        sessions.set(id_gen, r.data.access_token)
        res.cookie("sessionId", id_gen, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        return res.status(200).redirect("/home")
    })

})
app.get("/home", async (req, res) => {
    if(sessions.has(req.cookies.sessionId)) {
        let commonHeaders = {headers: {"Authorization": `Bearer ${sessions.get(req.cookies.sessionId)}`, "Content-type": "application/json",  "Accept-Encoding": "gzip,deflate,compress"}}
       let connections = (await axios.get("https://discord.com/api/v10/users/@me/connections", commonHeaders)).data;
        let data = (await axios.get("https://discord.com/api/v10/users/@me", commonHeaders)).data;
      
        return res.render("home", {data, connections})
       
      
    } else {
        res.redirect("/")
    }
   
})

