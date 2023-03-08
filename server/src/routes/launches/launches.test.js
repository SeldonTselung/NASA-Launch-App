const request = require('supertest'); 
//using supertest to start up our server and make req 
//directly against express in the app file. however we connect to mongo in server.js,which 
//starts server there. So we're not connecting to mongoDB when we run jest.

const app = require('../../app');

// we need to keep connection to mongo alive for both tests by wrapping the 
// 2 tests in another describe block and using a before all block inside that.
const {
    mongoConnect,
    mongoDisconnect, 
} = require ('../../services/mongo');

//we are creating end-to-end test so everytime we run the test, the post req
//will actually populate our database so we have to be careful about that.
//if we run these tests a lot, we should create a specific test db for our test
//data to separate it from production database.

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
        //we need to explicitly disconnect from mongoDB after the test completes
        //so the connection isn't forever. 
    });

    afterAll(async () => {
        await mongoDisconnect();
        //we need to explicitly disconnect from mongoDB after the test completes
        //so the connection isn't forever. 
    })

    describe("Test GET /launches", () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app)
            .get('/v1/launches')
            .expect('Content-Type', /json/)
            .expect(200);
        });
    }); 
    
    describe("Test POST /launch", () => {
        const completeLaunchData = {
            mission: 'USS Enterprise',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'January 4, 2028',        
        };
        const launchDataWithoutDate = {
            mission: 'USS Enterprise',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
        };
        const launchDataWithInvalidDate = {
            mission: 'USS Enterprise',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'zoot', 
        }
            
        test('It should respond with 201 created', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(completeLaunchData)
            .expect('Content-Type', /json/)
            .expect(201);
    
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
            //for body we use jest assertion api
            expect(response.body).toMatchObject(launchDataWithoutDate);
        });
    
        test('It should catch missing required properties', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithoutDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Missing required launch property',
            });
        });
    
        test('It should catch invalid dates', async() => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithInvalidDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Invalid launch date',
            });
        });
    });
})

