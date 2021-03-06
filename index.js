const express = require('express')
const cors = require('cors');
const uuid = require('uuid/v1');
const app = express()
const port = 3000
const bodyParser = require('body-parser')

const requestFilter = (req, res, next) => {
    res.locals.id = uuid();
    res.locals.log = logWithRequestData(req, res);
    next();
}
const responseFilter = (req, res, next) => {
    res.locals.log(`Responding with ${res.statusCode}`);
    next();
}
const logWithRequestData = (req, res) => (message) => {
    console.log(`[${new Date().toISOString()}][${req.method}][${req.path}][${res.locals.id}] ${message}`);
}

app.use(bodyParser.json());
app.use(requestFilter)

var corsOptionsDelegate = function (req, callback) {
    var corsOptions = {
        origin: '*',
        methods: ["GET", "POST", "PUT", "OPTIONS"],
        allowedHeaders: ["Content-Type"]
    };
    callback(null, corsOptions)
}
app.use(cors(corsOptionsDelegate))

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

const updateOrder = (id, params) => {
    const order = byId[id];
    if (!order) {
        return {err: {message: "Order does not exist", status: 404}}
    }
    const validationResult = validateParams(params);
    if (validationResult === true) {        
        const updatedOrder = {...order, title: params.title, status: params.status};
        byId[order.id] = updatedOrder;
        return {order: updatedOrder};
    } else {
        return {err: validationResult};
    }
}

app.get("/orders", (req, res, next) => {
    res.locals.log("Fetching all orders");
    res.json(fetchAllOrders());
    next();
});

app.get("/orders/:id", (req, res, next) => {
    res.locals.log("Fetching order by ID");
    const order = byId[req.params.id];
    
    if (order) {
        res.status(200).json(order);
    } else {
        res.locals.log(`Could not find order with ID : '${req.params.id}'`);
        res.status(404).json({error: "Could not find order"});
    }
    next();
})

app.post("/orders", (req, res, next) => {
    res.locals.log("Received a create order request");
    res.locals.log(JSON.stringify(req.body));
    const {order, err} = addOrder(req.body);
    if (order) {
        res.status(201).json(order);
    } else {
        res.locals.log(`Validation failed, message: '${err.message}'`);
        res.status(err.status).json({error: err.message});
    }
    next();
})

app.post("/orders/:id", (req, res, next) => {
    res.locals.log("Received an update order request");
    res.locals.log(JSON.stringify(req.body));
    if (!req.params.id) {
        res.status(400).json({error: "Invalid ID value provided"});
        next();
        return;
    }
    const {order, err} = updateOrder(req.params.id, req.body);
    if (order) {
        res.status(200).json(order);
    } else {
        res.locals.log(`Failed to update order, message: '${err.message}'`);
        res.status(err.status).json({error: err.message});
    }
    next();
})

app.use(responseFilter);
app.listen(port, () => {console.log("Started")});