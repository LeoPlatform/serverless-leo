package com.leo.load;

import io.leoplatform.sdk.LeoAWS;
import io.leoplatform.sdk.LoadingStream;
import io.leoplatform.sdk.bus.Bots;
import io.leoplatform.sdk.payload.SimplePayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.stream.IntStream;

import static java.time.Instant.now;

public class QuickstartLoader {
    private static final Logger log = LoggerFactory.getLogger(QuickstartLoader.class);

    private final QuickPayload quickPayload;

    private QuickstartLoader() {
        this.quickPayload = new QuickPayload();
    }

    public static void main(String[] args) {
        new QuickstartLoader().load();
    }

    private void load() {
        Instant start = now();
        log.info("Creating Leo loading stream");
        LoadingStream leo = LeoAWS.of(Bots.ofLoading("Java Quickstart", "QuickStart"));

        log.info("Loading generated payloads");
        int generatedPayloads = 10;
        IntStream.range(0, generatedPayloads)
                .mapToObj(i -> new SimplePayload(quickPayload.payload()))
                .forEach(leo::load);

        leo.end().thenAccept(streamStats -> {
            log.info("Finished loading {} payloads", generatedPayloads);
            log.info("Successful batches {}", streamStats.successes());
            log.info("Failed batches {}", streamStats.failures());
        }).join();

        log.info("Payloads written in {}ms", Duration.between(start, now()).toMillis());
    }
}
