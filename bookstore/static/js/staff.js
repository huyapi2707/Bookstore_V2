let currentFocus = -1
let orderID = -1
document.getElementById("searchUser").addEventListener("input", handleAutocompleteUser)


async function handleAutocompleteUser(event) {

    closeList()
    if (!event.target.value) return

    kw =event.target.value
    max = 5
    result = await fetch(`/api/user/search_by_phone?kw=${kw}&max=${max}`)
        .then(response => response.json())
    if (result.length < 1) {
        return
    } else {
        currentFocus = -1
        result_element = document.createElement("ul")
        result_element.setAttribute("style", "z-index: 99")
        result_element.setAttribute("id", "autocomplete-list")
        result_element.setAttribute("class", "list-group autocomplete-items")
        event.target.parentNode.appendChild(result_element)
        for (let i = 0; i < result.length; i++) {
            result_item = document.createElement("li")
            result_item.setAttribute("class", "list-group-item")
            result_item.innerHTML = "<strong>" + result[i]['phone'] + "</strong>"
            result_item.innerHTML += "<p style='max-width: 200px'>" + "Name: " + result[i]['name'] + "</p>"
            result_item.innerHTML += "<input type='hidden' value='" + result[i]['phone'] + "'>"
            result_item.addEventListener("click", (e) => {
                if (e.target.classList.contains("list-group-item")) {
                    event.target.value = e.target.getElementsByTagName("input")[0].value
                    closeList()
                }
            })
            result_element.appendChild(result_item)
        }
    }
}


function closeList() {
    list = document.getElementsByClassName("autocomplete-items")
    for (el of list) {
        el.parentNode.removeChild(el)
    }
}

function addActive(x) {

    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("active");
}

function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("active");
    }
}

document.addEventListener("click", function (e) {
    closeList();
});
document.getElementById("searchUser").addEventListener("keydown", (e) => {

    var x = document.getElementById("autocomplete-list");
    if (x) x = x.getElementsByTagName("li");
    if (x) {
        if (e.key === "ArrowDown") {

            currentFocus++;
            addActive(x);
        } else if (e.key === "ArrowUp") { //up
            currentFocus--;
            addActive(x);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    }
})


document.getElementById("delivered").addEventListener("click", async (e) => {
        if (orderID > 0) {
            const response = await fetch(`/api/order_delivered?order_id=${orderID}`, {
                method: "POST"
            }).then((res) => res.json())
            if (response['code'] === 200) {
                if (confirm("Order is delivered")) {
                    clearData()
                }
            } else {
                alert("Fail")
            }
        }
    }
)
document.getElementById("pay").addEventListener("click", async (e) => {
    if (orderID > 0) {
        const money = document.getElementById("input-money").value
        if (money == null) {
            alert("Please enter money")
            return
        }
        const response = await fetch("/api/order/cash/pay", {
            method: "POST",
            body: JSON.stringify({
                "order_id": orderID,
                "received_money": money
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => res.json())
        if (response['code'] === 200) {

            if (confirm("Order has been paid successfully")) {
                clearData()
            }

        } else {
            alert("Order has been paid failed")
        }
    }
})
document.getElementById("searchOrder").addEventListener("submit", async (e) => {
    e.preventDefault()

    order_id = document.getElementById("orderID").value
    if (order_id === "" || order_id === null) {
        alert("Please enter order ID")
        return
    }
    data = await fetch(`/api/order_details?order_id=${order_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    }).then(reponse => {
        if (reponse.status === 200) {
            return reponse.json()
        } else {
            alert("ID not found")
            return null
        }
    })
        .catch(error => {
            console.log(error)
            return null
        })
    if (data) {
        clearData()
        // order details
        orderID = data['order_id']
        orderDetailsElement = document.getElementById("orderDetails")
        // details
        for (let detail of data["products"]) {
            let detailElement =
                `<tr class="mt-2">
                                <th>
                                    <div class="ratio ratio-1x1" style="width: 5rem; height: 5rem">
                                        <img
                                                src="${detail['image_src']}"
                                                class="figure-img img-fluid rounded"
                                                alt="..."
                                        />
                                    </div>
                                </th>
                                <th>
                                    <a
                                            class="article-title bold h5 text-decoration-none"
                                            href=""
                                    >${detail['name']}</a
                                    >
                                    <p>${detail['unit_price'].toLocaleString()} VNĐ</p>
                                </th>
                                <th>
                                    <input style="width: 5rem"
                                           type="number" id="quantity" class="form-control" name="quantity" min="1"
                                           value="${detail['quantity']}" disabled/>
                                </th>


                            <th>
                                <p>
                                    <strong
                                    >${detail['total'].toLocaleString()} VNĐ</strong
                                    >
                                </p>
                            </th>
                           </tr>`

            orderDetailsElement.innerHTML += detailElement
        }
        // order summaries
        document.getElementById("quantity-total").innerHTML = ` ${data['order_quantity_total']} Items
                                        <strong class="pull-right"
                                        >${data['grand_total'].toLocaleString()} VNĐ</strong
                                        >`
        if (data['quick_ship']) {
            document.getElementById("quick-ship").innerHTML = ` 24hr Shipping
                                    <strong class="pull-right">${data["quick_ship"].toLocaleString()} VNĐ</strong>`
        }
        document.getElementById("total-payment-plus-shipping").innerHTML = `Total
                                        <strong class="pull-right"
                                        >${data['grand_total_plus_shipping'].toLocaleString()} VNĐ</strong
                                        >`
        // check status
        statusElement = document.getElementById("order-status")
        payButton = document.getElementById("pay")
        deliveredButton = document.getElementById("delivered")
        inputMoneyElement = document.getElementById("input-money")
        if (data['isCanceled'] || data['isDelivered']) {
            payButton.classList.add("disabled")
            deliveredButton.classList.add("disabled")
            if (data['isCanceled']) {
                statusElement.innerText = "Status: CANCELED"
            } else {
                statusElement.innerText = "Status: DELIVERED"
            }
        } else if (!data['isPaid']) {
            payButton.classList.remove("disabled")
            inputMoneyElement.disabled = false
            deliveredButton.classList.add("disabled")
            statusElement.innerText = "Status: UNPAID"
        } else if (!data['isDelivered']) {
            payButton.classList.add("disabled")
            deliveredButton.classList.remove("disabled")
            statusElement.innerText = "Status: UNDELIVERED"

        }


    }
})

function clearData() {
    orderID = -1
    document.getElementById("order-status").innerHTML = "Status"
    document.getElementById("orderDetails").innerHTML = ""
    document.getElementById("quantity-total").innerHTML = "Items"
    document.getElementById("quick-ship").innerHTML = ""
    document.getElementById("total-payment-plus-shipping").innerHTML = "Total"
    document.getElementById("input-money").value = ""
    document.getElementById("input-money").disable = true
    document.getElementById("pay").classList.add("disabled")
    document.getElementById("delivered").classList.add("disabled")
}

// clear data  when order id is empty
document.getElementById("orderID").addEventListener("input", (e) => {
    if (!e.target.value || e.target.value === "") {
        clearData()
    }
})
