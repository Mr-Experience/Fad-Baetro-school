const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testExamConfiguration() {
    console.log('🧪 Testing Exam Configuration Functionality\n');

    // Get sample class and subject
    console.log('1. Getting sample class and subject...');
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .limit(1);

    if (classesError || !classes.length) {
        console.error('❌ No classes found:', classesError?.message);
        return;
    }

    const sampleClass = classes[0];
    console.log(`✅ Using class: ${sampleClass.class_name} (${sampleClass.id})`);

    const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', sampleClass.id)
        .limit(1);

    if (subjectsError || !subjects.length) {
        console.error('❌ No subjects found:', subjectsError?.message);
        return;
    }

    const sampleSubject = subjects[0];
    console.log(`✅ Using subject: ${sampleSubject.subject_name} (${sampleSubject.id})\n`);

    // Test 1: Check current exam configs
    console.log('2. Checking current exam configurations...');
    const { data: existingConfigs, error: configError } = await supabase
        .from('exam_configs')
        .select('*')
        .eq('class_id', sampleClass.id)
        .eq('subject_id', sampleSubject.id);

    if (configError) {
        console.error('❌ Error fetching configs:', configError.message);
        return;
    }

    console.log(`✅ Found ${existingConfigs.length} existing configurations`);
    existingConfigs.forEach(config => {
        console.log(`   - ${config.question_type}: ${config.is_active ? 'ACTIVE' : 'INACTIVE'}`);
    });
    console.log('');

    // Test 2: Simulate activating a test exam
    console.log('3. Testing exam activation (test type)...');
    const testConfig = existingConfigs.find(c => c.question_type === 'test');

    if (testConfig) {
        console.log('   Found existing test config, toggling status...');
        const newStatus = !testConfig.is_active;

        const { error: updateError } = await supabase
            .from('exam_configs')
            .update({ is_active: newStatus })
            .eq('id', testConfig.id);

        if (updateError) {
            console.error('❌ Update failed:', updateError.message);
        } else {
            console.log(`✅ Successfully ${newStatus ? 'activated' : 'deactivated'} test exam`);
        }
    } else {
        console.log('   No existing test config, creating new one...');
        const { data: newConfig, error: insertError } = await supabase
            .from('exam_configs')
            .insert({
                class_id: sampleClass.id,
                subject_id: sampleSubject.id,
                question_type: 'test',
                is_active: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ Insert failed:', insertError.message);
        } else {
            console.log('✅ Successfully created and activated test exam');
            console.log('   New config:', newConfig);
        }
    }

    // Test 3: Verify the change
    console.log('\n4. Verifying the configuration change...');
    const { data: updatedConfigs, error: verifyError } = await supabase
        .from('exam_configs')
        .select('*')
        .eq('class_id', sampleClass.id)
        .eq('subject_id', sampleSubject.id);

    if (verifyError) {
        console.error('❌ Verification failed:', verifyError.message);
    } else {
        console.log('✅ Verification successful');
        updatedConfigs.forEach(config => {
            console.log(`   - ${config.question_type}: ${config.is_active ? 'ACTIVE' : 'INACTIVE'}`);
        });
    }

    console.log('\n🎉 Exam configuration test completed!');
}

testExamConfiguration().catch(console.error);