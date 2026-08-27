const mainImage = document.querySelector("#mainProductImage");
const thumbnails = document.querySelectorAll(".thumbnail");

thumbnails.forEach(function (thumbnail) {

    thumbnail.addEventListener("click", function () {

        mainImage.src = thumbnail.src;

        thumbnails.forEach(function (item) {
            item.classList.remove("active");
        });

        thumbnail.classList.add("active");
    });

});
const addCartBtn = document.querySelector("#addCartBtn");

addCartBtn.addEventListener("click", function () {

    const quantity = document.querySelector("#quantity").value;

    const product = {
        name: "Wireless Earbuds",
        price: 45,
        image: "download.jpg",
        quantity: Number(quantity)
    };

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    console.log(cart);
});