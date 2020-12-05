// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();

const cors = require('cors')
app.use(cors())

let morgan = require('morgan')
app.use(morgan('combined'))

let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: "*/*" }))

let credentials = new Map()
let tokens = new Map()
let listing = new Map()
let cart = new Map()
let listingId = 0

app.get("/sourcecode", (req, res) => {
  res.send(require('fs').readFileSync(__filename).toString())
})

// This endpoint lets users create an account
app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password

    if (username == undefined) {
        res.send(JSON.stringify({ success: false, reason: "username field missing" }))
        return
    }

    if (password == undefined) {
        res.send(JSON.stringify({ success: false, reason: "password field missing" }))
        return
    }
  
    if (credentials.has(username)) {
        res.send(JSON.stringify({ success: false, reason: "Username exists" }))
        return
    }

    credentials.set(username, password)
    res.send(JSON.stringify({ success: true }))
    console.log("CREDENTIALS: ")
    console.log(credentials)

})


// LogIn
app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body)
    let username = parsed.username
    let password = parsed.password
    let expectedPassword = credentials.get(username)
    let token = ""
    console.log("expectedPassword", expectedPassword)


    if (username == undefined) {
      res.send(JSON.stringify({ success: false, reason: "username field missing" }))
      return
    }

    if (password == undefined) {
      res.send(JSON.stringify({ success: false, reason: "password field missing" }))
      return
    }
  
    if (expectedPassword === undefined) {
      res.send(JSON.stringify({ success: false, reason: "User does not exist" }))
      return
    }
  
    if (expectedPassword !== password) {
      res.send(JSON.stringify({ success: false, reason: "Invalid password" }))
      return
    }
  
    token = username + Math.random().toString(36).substr(2)
    tokens.set(token, username)
    console.log("TOKENS: ")
    console.log(tokens)
    res.send(JSON.stringify({ success: true, token: token }))
})

// This endpoint lets users change their password
app.post("/change-password", (req, res) => {
    let parsed = JSON.parse(req.body)
    let oldPassword = parsed.oldPassword
    let newPassword = parsed.newPassword
    let tokenId = req.headers.token
    let expectedPassword = credentials.get(tokens.get(tokenId)) 
    console.log("expectedPassword", expectedPassword)


    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (!expectedPassword.includes(oldPassword)) {
      res.send(JSON.stringify({ success: false, reason: "Unable to authenticate" }))
      return
    }
  
    credentials.set(tokens.get(tokenId), newPassword)
    res.send(JSON.stringify({ success: true }))
    console.log("CREDENTIALS: ")
    console.log(credentials)
})

// This endpoint adds an item to the marketplace, which can be purchased by any user.
app.post("/create-listing", (req, res) => {
    let parsed = JSON.parse(req.body)
    let price = parsed.price
    let description = parsed.description
    let tokenId = req.headers.token
    let sellerUsername = tokens.get(tokenId)

    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (price == undefined) {
      res.send(JSON.stringify({ success: false, reason: "price field missing" }))
      return
    }
  
    if (description == undefined) {
      res.send(JSON.stringify({ success: false, reason: "description field missing" }))
      return
    }
  
    listingId ++
    let obj = {"price": price, "description": description, "sellerUsername" : sellerUsername, "availability": true}
    
    listing.set(listingId, Object.entries(obj))
    res.send(JSON.stringify({ success: true, listingId : listingId}))
    console.log("LISTING: ")
    console.log(listing)
})

// This endpoint is used to get information about a particular item for sale
app.get("/listing", (req, res) => {
    let listingId = req.query.listingId
    let itemId = undefined
    let price = ""
    let description = ""
    let sellerUsername = ""
    
    let found = false
    for (let keys of listing.keys()) {
      if (keys == listingId) {
        found = true
      } 
    }
  
    if (found == false) {
      res.send(JSON.stringify({ success: false, reason: "Invalid listing id" }))
      return
    }
  
    console.log("GET VALUE FROM MAP")
    let obj = listing.get(parseInt(listingId))
    price = Object.values(obj)[0][1]
    description = Object.values(obj)[1][1]
    sellerUsername = Object.values(obj)[2][1]

    res.send(JSON.stringify({ success: true, listing : {"price": price,"description":description,"itemId":parseInt(listingId),"sellerUsername":sellerUsername}}))
    return
})

// This endpoint is used to modify a listing.
app.post("/modify-listing", (req, res) => {
    let parsed = JSON.parse(req.body)
    let itemid = parsed.itemid
    let price = parsed.price
    let description = parsed.description
    let tokenId = req.headers.token
    let sellerUsername = tokens.get(tokenId)

    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (itemid == undefined) {
      res.send(JSON.stringify({ success: false, reason: "itemid field missing" }))
      return
    }
  
    console.log("GET VALUE FROM MAP")
    console.log(listing)
    let obj = listing.get(parseInt(itemid))
    //price = Object.values(obj)[0][1]
    //description = Object.values(obj)[1][1]
    //console.log(price)
    //console.log(description)
  
    if (price == undefined) {
      price = Object.values(obj)[0][1]
    }
  
    if (description == undefined) {
        description = Object.values(obj)[1][1]
    }

    let values = {"price": price, "description": description, "sellerUsername" : sellerUsername, "availability": true}
    listing.set(itemid, Object.entries(values))
    console.log(listing)
    res.send(JSON.stringify({ success: true}))
    return
  })

// This endpoint is used to add an item to a user's cart
app.post("/add-to-cart", (req, res) => {
    let parsed = JSON.parse(req.body)
    let itemid = parsed.itemid
    let tokenId = req.headers.token
    let user = tokens.get(tokenId)
    let price = ""
    let description = ""
    let sellerUsername = ""



    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    if (itemid == undefined) {
      res.send(JSON.stringify({ success: false, reason: "itemid field missing" }))
      return
    }
  
    let found = false
    for (let keys of listing.keys()) {
      if (keys == itemid) {
        found = true
      } 
    }
  
    if (found == false) {
      res.send(JSON.stringify({ success: false, reason: "Item not found" }))
      return
    }
    
    let obj = listing.get(parseInt(itemid))
    price = Object.values(obj)[0][1]
    description = Object.values(obj)[1][1]
    sellerUsername = Object.values(obj)[2][1]
  
    let values = {"price":price, "description":description, "sellerUsername":sellerUsername, "user":user}
    
    cart.set(itemid, Object.entries(values))
    res.send(JSON.stringify({ success: true}))
})

// This endpoint is used to retrieve a list of items in a user's cart
app.get("/cart", (req, res) => {
    let tokenId = req.headers.token
    let user = tokens.get(tokenId)
    let price = ""
    let description = ""
    let itemId = ""
    let sellerUsername = ""

    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    console.log("CART:")
    console.log(cart)
    let reponse = []
    
    for (let keys of cart.keys()) {
      let obj = cart.get(parseInt(keys))
      if (Object.values(obj)[3][1] == user) {
        price = Object.values(obj)[0][1]
        description = Object.values(obj)[1][1]
        sellerUsername = Object.values(obj)[2][1]
        reponse.push({"price": price,"description":description,"itemId":keys,"sellerUsername":sellerUsername})
      }
    }
      
    res.send(JSON.stringify({ success: true, cart : reponse}))
    return
})


// This endpoint is used to purchase all the items in a user's cart
app.post("/checkout", (req, res) => {
    let tokenId = req.headers.token
    let user = tokens.get(tokenId)
    let price = ""
    let description = ""
    let itemId = ""
    let sellerUsername = ""

    if (tokenId == undefined) {
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
      return
    }
  
    if (!tokens.has(tokenId)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
    }
  
    console.log("CART")
    console.log(cart)
    console.log("LISTING")
    console.log(listing)
  
    let found = false
    
    for (let keys of cart.keys()) {
      let obj = cart.get(parseInt(keys))
      if (Object.values(obj)[3][1] == user) {
        itemId = keys
        found = true
      } 
    }
  
    console.log(itemId)
  
    if (found == false) {
      res.send(JSON.stringify({ success: false, reason: "Empty cart"}))
      return
    }
  
    
    
    let foundInListing = false
    
    for (let keys of listing.keys()) {
      if (keys == itemId) {
        foundInListing = true
      } 
    }
    
    console.log(foundInListing)
    
    if (foundInListing == false) {
      res.send(JSON.stringify({ success: false, reason: "Item in cart no longer available"}))
      return
    }
  
    
  
    let reponse = []
    for (let keys of cart.keys()) {
      let obj = cart.get(parseInt(keys))
      if (Object.values(obj)[3][1] == user) {
        price = Object.values(obj)[0][1]
        description = Object.values(obj)[1][1]
        sellerUsername = Object.values(obj)[2][1]
        listing.delete(keys)
        cart.delete(keys)
        reponse.push({"price": price,"description":description,"itemId":keys,"sellerUsername":sellerUsername, "user":user})
      }
    }
    console.log(reponse)
    console.log("LISTING")
    console.log(listing)
    console.log("CART")
    console.log(cart)
    res.send(JSON.stringify({ success: true}))
    return
  
})


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});