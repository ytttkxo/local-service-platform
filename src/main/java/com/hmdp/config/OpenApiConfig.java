package com.hmdp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Locale API")
                        .description("REST API for a local dining & shop review platform. "
                                + "Features Redis-backed caching, geospatial shop search, "
                                + "flash sale with distributed locking, and social blog feeds.")
                        .version("1.0.0"));
    }
}
