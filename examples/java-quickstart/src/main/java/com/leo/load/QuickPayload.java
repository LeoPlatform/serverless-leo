package com.leo.load;

import javax.json.Json;
import javax.json.JsonObject;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

class QuickPayload {
    private static final Random random = new Random();
    private static final List<String> fruit = Arrays.asList(
            "Banana", "Pear", "Strawberry", "Apple", "Orange", "Mango", "Nectarine", "Blueberry");
    private static final List<String> dogs = Arrays.asList(
            "Chihuahua", "Boxer", "Labrador Retriever", "Pembroke Welsh Corgi", "German Shepherd");

    JsonObject payload() {
        return Json.createObjectBuilder()
                .add("random_number", random.nextInt(1_000_000))
                .add("random_fruit", fruit.get(random.nextInt(fruit.size())))
                .add("random_dog", dogs.get(random.nextInt(dogs.size())))
                .build();
    }
}
