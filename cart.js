const cartItems = document.querySelector("#cartItems");
const cartSubtotal = document.querySelector("#cartSubtotal");
const cartTotal = document.querySelector("#cartTotal");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let total = 0;

cart.forEach(function (product) {

    const item = document.createElement("div");

    item.classList.add("cart-item");

    const itemTotal = product.price * product.quantity;

    total = total + itemTotal;

    item.innerHTML = `
        <img src="${product.image}" alt="${product.name}">

        <div class="cart-item-info">
            <h3>${product.name}</h3>
            <p>Quantity: ${product.quantity}</p>
            <p class="cart-item-price">
                ${itemTotal} MAD
            </p>
        </div>
    `;

    cartItems.appendChild(item);

});

cartSubtotal.textContent = total + " MAD";
cartTotal.textContent = total + " MAD";