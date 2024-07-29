import os
import pandas as pd
from time import sleep
from json import dumps
import tensorflow as tf
import pusher
from dotenv import load_dotenv
import yagmail


# Import the required library
from geopy.geocoders import Nominatim

# Importing transfoemeres for Text classification
from transformers import TFDistilBertForSequenceClassification
from transformers import DistilBertTokenizerFast

# Load environment variables from .env
load_dotenv()

# Initializaing gmail and giving permission to gmail
# yagmail.register("subhodip.ghosh2022@vitstudent.ac.in", "v7Kp1eWy2%")
yag = yagmail.SMTP("subhodip.ghosh2022@vitstudent.ac.in", os.getenv("EMAIL_PASS"))


# Initialize Nominatim API for geo coordinates
geolocator = Nominatim(user_agent="MyApp")


# For sending messege to pusher queue
pusher_client = pusher.Pusher(
    app_id=os.getenv("APP_ID"),
    key=os.getenv("KEY"),
    secret=os.getenv("SECRET"),
    cluster="ap2",
    ssl=True,
)


# Tokenizing and vetorizing
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

# Loading custom BERT model
loaded_model = TFDistilBertForSequenceClassification.from_pretrained(
    "../EnhancedModelForDisasterClassification"
)


# reading csv file for realtime streaming
df = pd.read_csv("../train_cleaned.csv")


df = df[["location", "text"]]


while True:
    dict_disaster = df.sample(1).to_dict(orient="records")[0]

    predict_input = tokenizer.encode(
        dict_disaster.get("text"), truncation=True, padding=True, return_tensors="tf"
    )

    tf_output = loaded_model.predict(predict_input)[0]
    tf_prediction = tf.nn.sigmoid(tf_output).numpy()[0]

    if (
        not pd.isna(dict_disaster.get("location"))
        and dict_disaster.get("location") != "[something]"
    ):
        try:
            location = geolocator.geocode(dict_disaster.get("location"))

            push_disaster = {
                "text": dict_disaster.get("text"),
                "location": {
                    "lat": location.latitude,
                    "lng": location.longitude,
                },
            }

            print(f" {push_disaster} ==> {tf_prediction[1]}")

            if location and tf_prediction[1] > 0.5:
                pusher_client.trigger("SOS-channel", "disaster", push_disaster)

                # TODO: Mail service
                try:
                    loc = dict_disaster.get("location")
                    txt = push_disaster.get("text")
                    latlng = push_disaster.get("location")
                    yag.send(
                        "macy16661@gmail.com",
                        f"ALERT! {loc} ",
                        f"{txt} \n {latlng}",
                    )

                except:
                    print("Email not sent")

        except:
            print("server time out")

    sleep(0.5)
