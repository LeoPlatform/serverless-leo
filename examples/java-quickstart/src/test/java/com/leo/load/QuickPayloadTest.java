package com.leo.load;

import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import javax.json.JsonObject;
import java.util.Set;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toSet;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

public class QuickPayloadTest {

    private final QuickPayload quickPayload = new QuickPayload();

    private final Set<String> knownFruit = Stream.of(
            "Banana", "Pear", "Strawberry", "Apple", "Orange", "Mango", "Nectarine", "Blueberry").collect(toSet());
    private final Set<String> knownDogs = Stream.of(
            "Chihuahua", "Boxer", "Labrador Retriever", "Pembroke Welsh Corgi", "German Shepherd").collect(toSet());

    @Test(dataProvider = "Payloads")
    public void testJsonFields(int payloadNum, JsonObject payload) {
        int numFields = payload.values().size();
        assertEquals(numFields, 3, "Payload " + payloadNum + " does not have three fields");
    }

    @Test(dataProvider = "Payloads")
    public void testValidFruit(int payloadNum, JsonObject payload) {
        String payloadFruit = payload.getJsonString("random_fruit").getString();
        assertTrue(knownFruit.contains(payloadFruit), "Unknown fruit in payload " + payloadNum);
    }

    @Test(dataProvider = "Payloads")
    public void testValidDog(int payloadNum, JsonObject payload) {
        String payloadDog = payload.getJsonString("random_dog").getString();
        assertTrue(knownDogs.contains(payloadDog), "Unknown dog in payload " + payloadNum);
    }

    @Test(dataProvider = "Payloads")
    public void testRandomNumberMax(int payloadNum, JsonObject payload) {
        int randomNum = payload.getInt("random_number");
        assertTrue(randomNum < 1_000_000, "Random number field above one million in payload " + payloadNum);
    }

    @Test(dataProvider = "Payloads")
    public void testRandomNumberMin(int payloadNum, JsonObject payload) {
        int randomNum = payload.getInt("random_number");
        assertTrue(randomNum >= 0, "Negative random number field in payload " + payloadNum);
    }

    @DataProvider(name = "Payloads")
    public Object[][] payloads() {
        return IntStream.range(0, 100)
                .mapToObj(i -> new Object[]{i, quickPayload.payload()})
                .toArray(Object[][]::new);

    }
}