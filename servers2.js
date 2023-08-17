const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
// const { pathToFileURL } = require("url");

const server = jsonServer.create();
const router = jsonServer.router('db.json'); // Change this to your data file name
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Custom authentication middleware
const authenticate = (req, res, next) => {
  // Your authentication logic here
  next();
};

// Attach authentication middleware
server.use(authenticate);

// Attach your other routes here
server.get('/products', (req, res) => {
  const products = router.db.get('products').value();

  return res.status(200).json({ products });
});

server.post('/register', (req, res) => {
  const newUser = req.body;
  const { username } = newUser;
  const user = router.db.get('users').find({ username }).value();

  if (user) {
    return res.status(401).json({ message: 'User already Exists' });
  }

  newUser.id = shortid();
  newUser.role = 'USER';
  router.db.get('users').push(newUser).write();
  return res
    .status(201)
    .json({ message: 'User registered successfully', user: newUser });
});

/* server.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = router.db.get('users').find({ username }).value();

  if (!user) {
    return res.status(401).json({ message: 'Invalid Credential' });
  }

  return res.status(201).json({ message: 'Login successful' });
});

server.post('/place-order', (req, res) => {
  const orderItems = req.body;
  console.log(orderItems);
  if (!orderItems) {
    return res.status(401).json({ message: 'Place order failed' });
  }

  router.db.get('orders').push(orderItems).write();
  return res
    .status(201)
    .json({ message: 'Order successful', items: orderItems });
}); */

server.post('/place-order', (req, res) => {
  const { userId, products, address } = req.body;
  console.log(userId, products);
  console.log('triggered');

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // const orderedProducts = products.map((productId) => {
  //   const product = router.db
  //     .get('products')
  //     .find({ id: productId.id })
  //     .value();
  //   if (!product) {
  //     return null; // Ignore invalid products
  //   }
  //   return product;
  // });

  const orderedProducts = products;

  console.log('products', products);

  if (orderedProducts.some((product) => !product)) {
    return res
      .status(400)
      .json({ message: 'One or more products are invalid' });
  }

  const newOrder = {
    id: shortid(),
    userId,
    address,
    products: orderedProducts,
  };
  router.db.get('orders').push(newOrder).write();

  return res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
});

server.get('/ordered-products', (req, res) => {
  const orderedProducts = router.db
    .get('orders')
    .sortBy('price')
    .map((product) => {
      const user = router.db.get('users').find({ id: product.userId }).value();
      const address = router.db
        .get('addresses')
        .find({ orderId: product.userId });
      return { ...product, user, address };
    })
    .value();

  return res.json(orderedProducts);
});

/* server.post('/placeOrder', (req, res) => {
  const { userId, products } = req.body;
  console.log(userId, products);
  console.log('triggered');

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const orderedProducts = products.map((productId) => {
    const product = router.db.get('products').find({ id: productId }).value();
    return product || null; // Filter out invalid products
  });

  console.log('orderedProducts', orderedProducts);

  if (orderedProducts.includes(null)) {
    return res
      .status(400)
      .json({ message: 'One or more products are invalid' });
  }

  const newOrder = { id: Date.now(), user, products: orderedProducts };
  router.db.get('orders').push(newOrder).write();

  return res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
}); */

/* server.post('/placeOrder', (req, res) => {
  const { userId, products } = req.body;
  console.log(userId, products);
  console.log('triggered');

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const orderedProducts = products.map((productID) => {
    const product = router.db
      .get('products')
      .find({ id: productID.id })
      .value();
    return product || null; // Filter out invalid products
  });

  console.log('orderedProducts', orderedProducts);

  if (orderedProducts.includes(null)) {
    return res
      .status(400)
      .json({ message: 'One or more products are invalid' });
  }

  const newOrder = { id: Date.now(), user, products: orderedProducts };
  router.db.get('orders').push(newOrder).write();

  return res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
}); */

server.get('/users/:userId/orders', (req, res) => {
  const userId = parseInt(req.params.userId);
  console.log('=====userId====', userId);
  const orders = router.db.get('orders').filter({ userId }).value();
  res.json(orders);
});

/* //!  add product id , user and name
router.post('/place-orders', (req, res) => {
  const { userId, products } = req.body;
  console.log('triggered');
  console.log(userId);

  console.log(req.body);

  const user = router.db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const orderedProducts = products.map((productId) => {
    const product = router.db.get().find({ id: productId.id }).value();
    return product || null;
  });

  if (orderedProducts.includes(undefined)) {
    return res
      .status(400)
      .json({ message: 'One or more products are invalid' });
  }

  const newOrder = {
    id: Date.now(),
    userId,
    productIds: orderedProducts.map((product) => product.id),
  };
  router.db.get('orders').push(newOrder).write();

  return res
    .status(201)
    .json({ message: 'Order placed successfully', order: newOrder });
}); */

server.use(router);

const PORT = 2000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
