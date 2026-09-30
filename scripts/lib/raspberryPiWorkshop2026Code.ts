/** Code samples for the Raspberry Pi Workshop CS 2026 session steps. */

export const LED_BLINK = `from gpiozero import LED
from time import sleep

led = LED(17)

try:
    while True:
        led.on()
        print("LED ON")
        sleep(1)

        led.off()
        print("LED OFF")
        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    led.off()
    led.close()
    print("LED OFF - Program stopped.")`

export const LED_BUTTON = `from gpiozero import LED, Button
from time import sleep

led = LED(17)
# Use bounce_time=0.1 to eliminate switch contact bounce
button = Button(27, bounce_time=0.1)

led_state = False


def toggle_led():
    global led_state

    led_state = not led_state

    if led_state:
        led.on()
        print("LED ON")
    else:
        led.off()
        print("LED OFF")


button.when_pressed = toggle_led

print("Button-controlled LED")
print("Press the button to toggle the LED.")
print("Press Ctrl+C to stop.")

try:
    while True:
        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    led.off()
    led.close()
    button.close()
    print("Program stopped safely.")`

export const LED_BUTTON_EMAIL = `from gpiozero import LED, Button
from time import sleep
import smtplib
from email.message import EmailMessage

led = LED(17)
button = Button(27, bounce_time=0.1)

EMAIL = "yourgmail@gmail.com"
APP_PASSWORD = "YOUR_APP_PASSWORD"

led_state = False


def send_email(subject, message):
    email = EmailMessage()
    email["From"] = EMAIL
    email["To"] = EMAIL
    email["Subject"] = subject
    email.set_content(message)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, APP_PASSWORD)
            smtp.send_message(email)

        print("Email sent!")

    except Exception as e:
        print("Email failed:", e)


def toggle_led():
    global led_state

    led_state = not led_state

    if led_state:
        led.on()
        print("LED ON")

        send_email(
            "Raspberry Pi - LED ON",
            "The LED was turned ON using the button."
        )

    else:
        led.off()
        print("LED OFF")

        send_email(
            "Raspberry Pi - LED OFF",
            "The LED was turned OFF using the button."
        )


button.when_pressed = toggle_led

print("LED + Button + Email")
print("Press the button to control the LED.")
print("Press Ctrl+C to stop.")

try:
    while True:
        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    led.off()
    led.close()
    button.close()
    print("Program stopped safely.")`

export const LDR_LED = `from gpiozero import LED, DigitalInputDevice
from time import sleep

led = LED(17)
ldr = DigitalInputDevice(18)

try:
    while True:

        if ldr.value == 1:
            # Dark / Night
            led.on()
            print("Night -> LED ON")

        else:
            # Bright / Day
            led.off()
            print("Day -> LED OFF")

        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    led.off()
    led.close()
    ldr.close()
    print("LED OFF - Program stopped.")`

export const LDR_LED_EMAIL = `from gpiozero import LED, DigitalInputDevice
from time import sleep
import smtplib
from email.message import EmailMessage

led = LED(17)
ldr = DigitalInputDevice(18)

EMAIL = "yourgmail@gmail.com"
APP_PASSWORD = "YOUR_APP_PASSWORD"


def send_email(subject, message):
    email = EmailMessage()
    email["From"] = EMAIL
    email["To"] = EMAIL
    email["Subject"] = subject
    email.set_content(message)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, APP_PASSWORD)
            smtp.send_message(email)

        print("Email sent!")

    except Exception as e:
        print("Email failed:", e)


previous_state = None

try:
    while True:

        current_state = ldr.value

        # 1 = dark
        if current_state == 1:

            if previous_state != 1:
                print("Night detected -> LED ON")
                led.on()

                send_email(
                    "Raspberry Pi - Night Detected",
                    "The LDR detected darkness. LED turned ON."
                )

        # 0 = bright
        else:

            if previous_state != 0:
                print("Day detected -> LED OFF")
                led.off()

                send_email(
                    "Raspberry Pi - Day Detected",
                    "The LDR detected daylight. LED turned OFF."
                )

        previous_state = current_state

        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    led.off()
    led.close()
    ldr.close()
    print("Program stopped safely.")`

export const PIR_MOTION = `from gpiozero import MotionSensor
from time import sleep

pir = MotionSensor(23)


def motion_detected():
    print("Motion detected!")


def motion_stopped():
    print("Motion stopped.")


pir.when_motion = motion_detected
pir.when_no_motion = motion_stopped

print("PIR Motion Sensor")
print("Waiting for motion...")
print("Press Ctrl+C to stop.")

try:
    while True:
        sleep(1)

except KeyboardInterrupt:
    print("\\nStopping...")

finally:
    pir.close()
    print("PIR program stopped.")`

export const HOME_AUTOMATION = `from gpiozero import LED, Button, DigitalInputDevice, MotionSensor, Buzzer
from time import sleep
import smtplib
from email.message import EmailMessage


# ==========================================
# GPIO PINS
# ==========================================

LED_PIN = 17
BUTTON_PIN = 27
LDR_PIN = 18
PIR_PIN = 23
BUZZER_PIN = 24


# ==========================================
# DEVICES
# ==========================================

led = LED(LED_PIN)

button = Button(BUTTON_PIN, bounce_time=0.1)

# LDR:
# 0 = DAY
# 1 = NIGHT
ldr = DigitalInputDevice(LDR_PIN)

pir = MotionSensor(PIR_PIN)

# Buzzer is ACTIVE-LOW
buzzer = Buzzer(BUZZER_PIN, active_high=False)


# ==========================================
# EMAIL
# ==========================================

EMAIL = "yourgmail@gmail.com"
APP_PASSWORD = "YOUR_APP_PASSWORD"


def send_email(subject, message):

    email = EmailMessage()

    email["From"] = EMAIL
    email["To"] = EMAIL
    email["Subject"] = subject

    email.set_content(message)

    try:

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, APP_PASSWORD)
            smtp.send_message(email)

        print("Email sent!")

    except Exception as e:

        print("Email failed:", e)


# ==========================================
# SYSTEM STATE
# ==========================================

is_night = False


# ==========================================
# BUTTON CONTROL
# ==========================================

def button_pressed():

    if led.is_lit:

        led.off()

        print("Button -> LED OFF")

        send_email(
            "Raspberry Pi - LED OFF",
            "The LED was turned OFF using the button."
        )

    else:

        led.on()

        print("Button -> LED ON")

        send_email(
            "Raspberry Pi - LED ON",
            "The LED was turned ON using the button."
        )


# ==========================================
# PIR MOTION
# ==========================================

def motion_detected():

    # PIR only works at night
    if not is_night:
        return

    print("Motion detected!")

    buzzer.on()

    send_email(
        "Raspberry Pi - Motion Detected",
        "Motion has been detected during nighttime."
    )


def motion_stopped():

    buzzer.off()

    print("Motion stopped.")


# ==========================================
# CALLBACKS
# ==========================================

button.when_pressed = button_pressed

pir.when_motion = motion_detected
pir.when_no_motion = motion_stopped


# ==========================================
# STARTUP
# ==========================================

print("======================================")
print("      RASPBERRY PI HOME AUTOMATION")
print("======================================")
print()
print("LDR:")
print("0 = DAY")
print("1 = NIGHT")
print()
print("DAY:")
print("Default LED = OFF")
print("Button can toggle LED")
print()
print("NIGHT:")
print("Default LED = ON")
print("Button can toggle LED")
print("PIR ACTIVE")
print()
print("MOTION AT NIGHT:")
print("Buzzer ON")
print("Email sent")
print()
print("Press Ctrl+C to stop.")
print("======================================")


# ==========================================
# MAIN LOOP
# ==========================================

try:

    while True:

        light = ldr.value

        # ==================================
        # NIGHT (LDR = 1)
        # ==================================

        if light == 1:

            if not is_night:

                is_night = True

                print("\\nNIGHT DETECTED")
                print("PIR ACTIVE")

                # NIGHT DEFAULT: LED ON
                led.on()

                print("LED ON")

        # ==================================
        # DAY (LDR = 0)
        # ==================================

        else:

            if is_night:

                is_night = False

                print("\\nDAY DETECTED")
                print("PIR IGNORED")

                # DAY DEFAULT: LED OFF
                led.off()

                # Buzzer always OFF during day
                buzzer.off()

                print("LED OFF")

        sleep(1)


except KeyboardInterrupt:

    print("\\n\\nStopping system...")


finally:

    led.off()
    buzzer.off()

    led.close()
    button.close()
    ldr.close()
    pir.close()
    buzzer.close()

    print("LED OFF")
    print("Buzzer OFF")
    print("GPIO cleaned up")
    print("Program stopped safely.")`
