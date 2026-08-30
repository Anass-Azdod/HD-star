import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://gkwkorqpktidgxladvzi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM')



const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", function () {
    navLinks.classList.toggle("active");
});


let main = document.querySelector("main")

async function loadproducts() {
    let{data,error} = await supabase
    .from("hd-store") 
    .select("*")

    if(error){
        console.error(error)
        return
    }
    
    let productDiv = document.querySelector(".product-grid")
    productDiv.replaceChildren()

    let categories = {}

    data.forEach(product=>{

        let productElements = document.createElement("div")
        productElements.classList.add("product-card")
        productElements.dataset.id = product.id


        let categorydiv;
        let category = product.category
        if (!categories[category]){
            categorydiv = document.createElement("div")
            categorydiv.classList.add("category-div")
            
            let title = document.createElement("h2")
            title.classList.add("category-title")
            title.textContent = product.category
            
            categories[category] = categorydiv
            categorydiv.append(title)
            productDiv.append(categorydiv)
            
        }

        let productImg = document.createElement("div")
        productImg.classList.add("product-image")


        let h2tag = document.createElement("h2")
        h2tag.id = "h2tag"
        h2tag.classList.add("product-name")
        h2tag.textContent = product.name

        let pricetag = document.createElement("h3")
        pricetag.id = "pricetag"
        pricetag.classList.add("product-price")
        pricetag.textContent = product.price.toFixed(2) + " Dh"

        let imgtag = document.createElement("img")
        imgtag.id = "imgtag"
        imgtag.src = product.img

        let cartbtn = document.createElement("button")
        cartbtn.classList.add("cart-btn")
        cartbtn.textContent = "اضف الى السلة"
        cartbtn.addEventListener("click",(e)=>{
            e.stopPropagation();
            let cart = JSON.parse(localStorage.getItem("cart")) || []
            if(!cart.some(item=>item.name === product.name)){
              cart.push({
                  id:product.id,
                  name:product.name,
                  price:product.price
              })
            }
            localStorage.setItem("cart", JSON.stringify(cart))
            cartbtn.classList.add("added")
            cartbtn.textContent = "تمت الإضافة ✓"
        })

            productImg.append(imgtag)
        productElements.append( productImg,h2tag,pricetag,cartbtn ) 
        categories[category].append(productElements) 
        productElements.addEventListener("click",()=>{
            let id = productElements.dataset.id
            window.location.href = `product.html?id=${id}`;  
        })
    })
}
loadproducts()
