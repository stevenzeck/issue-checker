import * as core from '@actions/core'

async function run(): Promise<void> {
    try {

    } catch (error: any) {
        core.error(error);
        core.setFailed(error.message);
    }
}

run()
