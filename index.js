const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
app.use(bodyParser.json());

const OrderStatus = Object.freeze({
    SUBMITTED: "submitted",
    PROCESSING: "processing",
    IN_TRANSIT: "in transit",
    DELIVERED: "delivered",
    CANCELLED: "cancelled"
});

let id = 0;
const orderIds = [];
const byId = {};

const fetchAllOrders = () => {
    return orderIds.map(id => byId[id]);
}

const validateParams = (params) => {
    if (!params.title || typeof params.title !== 'string') {
        return {message: "Title missing", status: 400};
    }
    if (!params.status || typeof params.status !== 'string') {
        return {message: "Status missing", status: 400};
    }
    if (params.title.length === 0) {
        return {message: "Title is an empty string", status: 400};
    }
    if (OrderStatus[params.status] === undefined) {
        return {message: "Invalid value for status provided", status: 400};
    }
    return true;
}

const addOrder = (params) => {
    const validationResult = validateParams(params);
    if (validationResult === true) {
        const order = {id: id++, title: params.title, status: params.status};
        byId[order.id] = order;
        orderIds.push(order.id);
        return {order};
    } else {
        return {err: validationResult};
    }

}

app.get("/orders", (req, res) => {
    console.log("Fetching orders");
    res.type("application/json");
    res.set("Access-Control-Allow-Headers", ["accept", "Content-Type"]);
    res.set("Access-Control-Allow-Origin", "*");
    res.send(JSON.stringify(fetchAllOrders()));
});

app.get("/orders/:id", (req, res) => {
    const order = byId[req.params.id];
    res.type("application/json");
    if (order) {
        res.status(200).send(JSON.stringify(order));
    } else {
        res.status(404).send(JSON.stringify({error: "Could not find order"}));
    }
})

app.post("/orders", (req, res) => {
    console.log("Received a create order request");
    console.dir(req.body);
    const {order, err} = addOrder(req.body);
    res.type("application/json");
    if (order) {
        res.status(201).send(JSON.stringify(order));
    } else {
        res.status(err.status).send(JSON.stringify({error: err.message}));
    }
})

// app.use(async (ctx, next) => {
//     const method = ctx.request.method.toUpperCase();
//     if (method === "GET") {
//         const path = ctx.request.path;
//         if (body && body.id) {
//             const order = byId[body.id];
//             if (order) {
//                 ctx.body = order;
//             } else {
//                 ctx.throw(404);
//             }
//         } else {
//             ctx.body = fetchAllOrders();
//         }
//     } else if (method === "POST") {
//         const {order, err} = addOrder(ctx.request.body);
//         if (order) {
//             ctx.body = order;
//             ctx.status = 201;
//         } else {
//             ctx.body = err.message;
//             ctx.status = err.status;
//         }
//     }
    
// });

app.listen(port, () => {console.log("Started")});