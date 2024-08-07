# New task module

Tasks should be linked to some portion of a care flow (an activity, a step, a track, a care flow). This particular application is currently linking tasks to activities, which is the smallest unit of work inside of Awell.

The goal here is to help organizations who currently do not currently control their own tasking system by providing a simple one. Currently, it should not be expected to be maintained, but this decision may change at some point in the future.

## Running the application

1. clone the repo
2. `docker-compose up`
3. `docker exec -it task_management_backend yarn migrate`
4. you're good to go
