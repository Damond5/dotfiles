#!/usr/bin/env sh

mvn -B archetype:generate \
-DgroupId=nordbo.nrs \
-DartifactId=nordbo-nrs \
-DarchetypeArtifactId=maven-archetype-quickstart \
-DarchetypeVersion=1.4
