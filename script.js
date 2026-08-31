import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://gkwkorqpktidgxladvzi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2tvcnFwa3RpZGd4bGFkdnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzNzAsImV4cCI6MjA4OTU5MjM3MH0.hBT4v2wUyn2KRme6dutz4cK0pApZyF9fonRb0DPyQxM')
const bucketName = 'hd-store'



const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn?.addEventListener("click", function () {
    navLinks.classList.toggle("active");
});


let main = document.querySelector("main")

function getImageUrl(product) {
    const image = product.img || (Array.isArray(product.images) ? product.images[0] : '')
    if (!image || typeof image !== 'string') return ''
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) return image
    return supabase.storage.from(bucketName).getPublicUrl(image).data.publicUrl
}

async function loadproducts() {
    let{data,error} = await supabase
    .from("hd-store") 
    .select("*")

    if(error){
        console.error(error)
        return
    }
    
    let productDiv = document.querySelector(".product-grid")
    let categoryGrid = document.querySelector(".category-grid")
    productDiv.replaceChildren()
    categoryGrid.replaceChildren()

    let categories = {}

    const categoryNames = [...new Set(data.map(product => product.category?.trim() || "غير مصنف"))]
    categoryNames.forEach((category, index) => {
        const categoryCard = document.createElement("a")
        categoryCard.classList.add("category-card")
        categoryCard.href = `#category-${index}`

        const categoryName = document.createElement("h3")
        categoryName.textContent = category
        const categoryLink = document.createElement("span")
        categoryLink.textContent = "استكشف →"

        categoryCard.append(categoryName, categoryLink)
        categoryGrid.append(categoryCard)
    })

    data.forEach(product=>{

        let productElements = document.createElement("div")
        productElements.classList.add("product-card")
        productElements.dataset.id = product.id


        let categorydiv;
        let category = product.category?.trim() || "غير مصنف"
        if (!categories[category]){
            categorydiv = document.createElement("div")
            categorydiv.classList.add("category-div")
            categorydiv.id = `category-${categoryNames.indexOf(category)}`
            
            let title = document.createElement("h2")
            title.classList.add("category-title")
            title.textContent = category
            
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
        pricetag.textContent = (Number(product.price) || 0).toFixed(2) + " Dh"

        let imgtag = document.createElement("img")
        imgtag.id = "imgtag"
        imgtag.src = getImageUrl(product)
        imgtag.alt = product.name || 'منتج'

        let cartbtn = document.createElement("button")
        cartbtn.classList.add("cart-btn")
        cartbtn.textContent = "اضف الى السلة"
        cartbtn.addEventListener("click",(e)=>{
            e.stopPropagation();
            let cart = JSON.parse(localStorage.getItem("cart")) || []
            const itemInCart = cart.find(item => String(item.id) === String(product.id))
            if (!itemInCart) {
              cart.push({
                  id:product.id,
                  name:product.name,
                  price:product.price,
                  img: product.img,
                  images: product.images,
                  quantity: 1
              })
            } else {
              itemInCart.quantity = Math.max(1, Number(itemInCart.quantity) || 1) + 1
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
