import datetime
from cryptography.fernet import Fernet
from flask import url_for
from flask_mailman import EmailMessage
from flask_security import hash_password

import config
from bookstore import dao
import cloudinary.uploader
from passlib import pwd


def save_picture(form_picture):
    response = cloudinary.uploader.upload(form_picture)
    return response['secure_url']


def send_verify_code(user_id):
    user = dao.get_user_by_id(user_id)
    if not user or user.active:
        return -1
    from_email = config.MAIL_USERNAME
    to_email = user.email
    subject = "Account verify code"
    # generate verify code base on amount of user
    code = str(dao.count_user() + 1).rjust(5, "0")

    register_code = dao.save_register_code(code=code, user_id=user_id)
    content = "Your account confirm code is: %s \nBookstore" % code

    message = EmailMessage(subject, content, from_email, [to_email])
    message.send()
    return 0


def verify_account(code):
    register_code = dao.get_register_code(code)
    if not register_code:
        return -1
    if not register_code.enable:
        return -2
    if register_code.user.active and (register_code.user.confirmed_at is not None):
        return -3
    register_code.enable = False
    dao.update_register_code(register_code=register_code)
    user = register_code.user
    user.active = True
    user.confirmed_at = datetime.datetime.now()
    dao.save_user(user=user)
    return 0


def resend_register_code(user_id):
    user = dao.get_user_by_id(user_id)
    if not user or user.active or (user.confirmed_at is not None):
        return -1
    from_email = config.MAIL_USERNAME
    to_email = user.email
    subject = "Account verify code"
    if not user.register_code:
        code = str(dao.count_user()).rjust(5, "0")
        register_code = dao.save_register_code(code=code, user_id=user_id)
    else:
        code = user.register_code.code
    content = "Your account confirm code is: %s \nBookstore" % code
    message = EmailMessage(subject, content, from_email, [to_email])
    message.send()
    return 0


def extract_search_user_by_phone(kw, max=5):
    list_user = dao.search_user_by_phone(kw, max)
    print(list_user)
    result = []
    for user in list_user:
        result.append({
            "name": user.first_name + " " + user.last_name,
            "phone": user.phone_number
        })
    return result


def handle_oauth2_user(fetched_data):
    email = fetched_data["emailAddresses"][0]['value']
    user = dao.get_user_by_email(email)
    if user:
        return user
    username = fetched_data['names'][0]['displayName']
    first_name = fetched_data['names'][0]['familyName']
    last_name = fetched_data['names'][0]['givenName']
    gender = True if fetched_data['genders'][0]['value'] == 'male' else False
    image = fetched_data['photos'][0]['url']
    initial_password = pwd.genword()
    user = dao.create_full_infor_user(
        last_name=last_name,
        first_name=first_name,
        username=username,
        email=email,
        gender=gender,
        image=image,
        active=True,
        password=hash_password(initial_password)
    )

    # send initial email
    from_email = config.MAIL_USERNAME
    to_email = user.email
    content = f'Welcome to bookstore. \nYour initial password is: {initial_password} \nThank you.'
    message = EmailMessage(from_email=from_email, subject="Your account's initial password", to=[to_email],
                           body=content)
    message.send()
    return user


def fernet_encrypt(plaintext, key=config.FERNET_KEY):
    return Fernet(key.encode()).encrypt(plaintext.encode()).decode()


def fernet_decrypt(ciphertext, key=config.FERNET_KEY):
    return Fernet(key.encode()).decrypt(ciphertext.encode()).decode()


def reset_password(email):
    if email is not None:
        user = dao.get_user_by_email(email)
        if user and user.has_role("user"):

            secret = fernet_encrypt(
                user.email + '+' + (datetime.datetime.now() + datetime.timedelta(minutes=15)).__str__())
            reset_url = url_for("users.forget_password_reset", token=secret, _external=True)
            content = f'Your reset password url:\n{reset_url}\nThe url will expired in 15 minutes'
            message = EmailMessage(from_email=config.MAIL_USERNAME, to=[email], subject="BOOKSTORE: RESET PASSWORD URL",
                                   body=content)
            message.send()
            return reset_url
        return None
    return None


def handle_reset_password(token, password):
    try:
        decrypt = fernet_decrypt(token).split("+")
        email = decrypt[0]
        date = decrypt[1]
        user = dao.get_user_by_email(email)
        date = datetime.datetime.strptime(date,"%Y-%m-%d %H:%M:%S.%f")

        if user is not None and date > datetime.datetime.now():
            password = hash_password(password)
            user.password = password
            dao.save_user(user)
            return user
        else:
            return None
    except Exception as e:
        print(e)
        return None


