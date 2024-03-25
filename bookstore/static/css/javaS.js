function addComment(bookId){
    let content = document.getElementById('commentId')
    if (content !== null){
        fetch('/api/comments', {
            method:'post',
            body: JSON.stringify({
                'book_id':bookId,
                'content': content.value
            }),
            headers:{
                'Content-Type':'application/json'
            }
        }).then(function (res){

            return res.json()
        }).then(function (data) {

            if(data.status == 201){
                let comments = document.getElementById('commentArea')
                comments.innerHTML=getCommentHtml(data.comment)+comments.innerHTML
                content.value=''
            }
            else if (data.status == 404){alert(data.err_msg)}
        })
    }
}

function loadComments(bookId, page=1){
    fetch(`/api/book/${bookId}/comments?page=${page}`).then(res=>res.json()).then(data=>{
        console.info(data)
        let comments = document.getElementById('commentArea')
        comments.innerHTML=""
        for(let i=0; i<data.length;i++)
            comments.innerHTML+=getCommentHtml(data[i])
    })
}

function getCommentHtml(comment){
    let image = comment.user.avatar
    if (image===null || !image.startsWith('https'))
        image='https://hanoispiritofplace.com/wp-content/uploads/2017/05/tai-anh-tinh-yeu-dep-5.jpg'
    return`
    <div class="content-section">
        <div class="d-flex">
            <div class="w-100">
                <img class="rounded-circle account-img"
                    style="
                        width: 30px;
                        height: 30px;
                        margin: 0px 10px 0px 0;
                    "
                    src="${image}"/>
                <span class="text-muted">${ comment.user.username }</span>
            </div>
            <p class="flex-shrink-1 text-nowrap text-success"><em>${moment(comment.created_date).locale('en').fromNow() }</em></p>
        </div>

        <div class="bg-white rounded p-2 mt-1 border border-1" style="">
            ${ comment.content }
        </div>
    </div>
    `
}

document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    var darkModeButton = document.querySelector('.dark-mode-button');

    function toggleDarkMode(event) {
        event.preventDefault();
        body.classList.toggle('dark-mode');
        var isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);

        var icon = document.getElementById('switch_mode');
        if (icon) {
            if (isDarkMode) {
                icon.classList.remove('bi-moon-stars-fill');
                icon.classList.add('bi-brightness-high');
            } else {
                icon.classList.remove('bi-brightness-high');
                icon.classList.add('bi-moon-stars-fill');
            }
        }
        var h1Elements = document.querySelectorAll('h1');
        var h3Elements = document.querySelectorAll('h3');
        if (isDarkMode) {
            h1Elements.forEach(function(element) {
                element.classList.add('dark-mode-h1');
            });
            h3Elements.forEach(function(element) {
                element.classList.add('dark-mode-h3');
            });
        } else {
            h1Elements.forEach(function(element) {
                element.classList.remove('dark-mode-h1');
            });
            h3Elements.forEach(function(element) {
                element.classList.remove('dark-mode-h3');
            });
        }
    }

    darkModeButton.addEventListener('click', toggleDarkMode);

    var isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        body.classList.add('dark-mode');
        var icon = document.getElementById('switch_mode');
        if (icon) {
            icon.classList.remove('bi-moon-stars-fill');
            icon.classList.add('bi-brightness-high');
        }
    }

    window.addEventListener('pageshow', function (event) {
        var isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            body.classList.add('dark-mode');
            var icon = document.getElementById('switch_mode');
            if (icon) {
                icon.classList.remove('bi-moon-stars-fill');
                icon.classList.add('bi-brightness-high');
            }
        } else {
            body.classList.remove('dark-mode');
            var icon = document.getElementById('switch_mode');
            if (icon) {
                icon.classList.remove('bi-brightness-high');
                icon.classList.add('bi-moon-stars-fill');
            }
        }
    });
});