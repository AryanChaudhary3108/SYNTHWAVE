import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { notifications } from '@mantine/notifications';
import { Select, Checkbox } from '@mantine/core';
import './ApplicationForm.css';

const ApplicationForm: React.FC = () => {
	const navigate = useNavigate();
	const [currentSection, setCurrentSection] = useState(1);
	const [formData, setFormData] = useState({
		real_name: '',
		age: '',
		discord_user_id: '',
		microphone: '',
		other_servers: '',
		memorable_scenario: '',
		character_name: '',
		backstory: '',
		goal: '',
		fail_rp: '',
		metagaming: '',
		powergaming: '',
		scenario1: '',
		scenario2: '',
		scenario3: '',
		agreement: false,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitCooldown, setSubmitCooldown] = useState(false);
	const [submissionStatus, setSubmissionStatus] = useState(false);
	const [cooldownTime, setCooldownTime] = useState(5);
	const [isFormEnabled, setIsFormEnabled] = useState(false);
	const [loading, setLoading] = useState(true);
	const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
	const [cooldownDaysLeft, setCooldownDaysLeft] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [applicationId, setApplicationId] = useState<string | null>(null);

	useEffect(() => {
		const fetchAuthenticatedUser = async () => {
			try {
				const { data: authData, error: authError } = await supabase.auth.getUser();
				if (authError || !authData?.user) {
					notifications.show({
						title: 'Error',
						message: 'Authentication error. Please log in again.',
						color: 'red',
					});
					navigate('/');
					return;
				}
				const metadata = authData.user?.user_metadata;
				if (metadata?.provider_id) {
					setFormData((prev) => ({
						...prev,
						discord_user_id: metadata.provider_id,
					}));
				}

				setUserId(authData.user.id);
			} catch (err) {
				console.error('Error fetching user:', err);
			}
		};
		fetchAuthenticatedUser();
	}, [navigate]);

	useEffect(() => {
		const fetchFeatureFlag = async () => {
			try {
				const { data, error } = await supabase
					.from('features')
					.select('status, cooldown_time')
					.eq('feature_name', 'application_form')
					.single();

				if (error) {
					notifications.show({
						title: 'Error',
						message: 'Unable to load application form settings.',
						color: 'red',
					});
					setIsFormEnabled(false);
				} else {
					setIsFormEnabled(data?.status === 'enabled');

					if (data?.cooldown_time && !isNaN(data.cooldown_time)) {
						setCooldownTime(data.cooldown_time);
					} else {
						console.warn('Invalid cooldown time received from the database. Falling back to default.');
						setCooldownTime(5);
					}
				}
			} catch (err) {
				console.error('Error fetching feature flag:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchFeatureFlag();
	}, []);

	useEffect(() => {
		const checkSubmissionStatus = async () => {
			if (!userId) return;

			try {
				const { data: submissionData, error: submissionError } = await supabase
					.from('applications')
					.select('id, last_submit_time, status')
					.eq('user_id', userId)
					.order('last_submit_time', { ascending: false })
					.limit(1)
					.single();
				if (submissionError) {
					console.error('Error fetching submission status:', submissionError);
					return;
				}

				if (submissionData) {
					const lastSubmitTime = new Date(submissionData.last_submit_time).getTime();
					const cooldownTimeMs = cooldownTime * 24 * 60 * 60 * 1000;
					const timeElapsed = Date.now() - lastSubmitTime;

					setSubmitCooldown(timeElapsed < cooldownTimeMs);
					if (timeElapsed < cooldownTimeMs) {
						const daysLeft = Math.ceil((cooldownTimeMs - timeElapsed) / (1000 * 60 * 60 * 24));
						setCooldownDaysLeft(daysLeft);
					}
					setApplicationId(submissionData.id);
					setApplicationStatus(submissionData.status);
				}
			} catch (err) {
				console.error('Unexpected error checking submission status:', err);
			}
		};
		checkSubmissionStatus();
	}, [userId, cooldownTime]);

	const handleGoBack = () => {
		navigate('/');
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;

		if (type === 'checkbox') {
			const { checked } = e.target as HTMLInputElement;
			setFormData((prev) => ({
				...prev,
				[name]: checked,
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleNext = () => setCurrentSection((prev) => prev + 1);
	const handlePrev = () => setCurrentSection((prev) => prev - 1);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			const requiredFields = [
				'real_name',
				'age',
				'discord_user_id',
				'microphone',
				'other_servers',
				'memorable_scenario',
				'character_name',
				'backstory',
				'goal',
				'fail_rp',
				'metagaming',
				'powergaming',
				'scenario1',
				'scenario2',
				'scenario3',
				'agreement',
			];

			const missingFields = requiredFields.filter(
				(field) => !formData[field as keyof typeof formData]
			);
			if (missingFields.length > 0) {
				notifications.show({
					title: 'Validation Error',
					message: 'Please fill out all required fields. Redirecting to home...',
					color: 'red',
				});
				setTimeout(() => {
					navigate('/');
				}, 3000);
				return;
			}

			if (submitCooldown) {
				notifications.show({
					title: 'Cooldown Active',
					message: `You can submit your application again in ${cooldownDaysLeft} days.`,
					color: 'blue',
				});
				return;
			}

			const { error, data } = await supabase
				.from('applications')
				.insert([
					{
						...formData,
						user_id: userId,
						last_submit_time: new Date().toISOString(),
					},
				])
				.select('id')
				.single();

			if (error) {
				notifications.show({
					title: 'Submission failed',
					message: `Submission failed. Error: ${error.message || 'Please try again.'}`,
					color: 'red',
				});
			} else if (data?.id) {
				setApplicationId(data.id);
				setApplicationStatus('pending');
				notifications.show({
					title: 'Application Submitted',
					message: `Your application has been submitted successfully! Application ID: ${data.id}`,
					color: 'green',
				});
				navigate('/');
			}
		} catch (err) {
			console.error('Error submitting form:', err);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="loading-spinner"></div>;
	}

	if (!isFormEnabled) {
		return (
			<div className="center-container">
				<h2 className="disabled-message">The Application Form Is Currently Closed.</h2>
				<button type="button" onClick={handleGoBack} className="form-button">Home</button>
			</div>
		);
	}

	if (submitCooldown) {
		return (
			<div className="center-container">
				<h2 className="disabled-message">Thank You For Your Submission!</h2>
				{applicationStatus === 'pending' && (
					<div className="info-message">
						<span className="label">Your Application ID: </span>
						<span className="value">{applicationId}</span>
						<br />
						<span className="label">Your Application Is Still </span>
						<span className="status pending">Under Review</span>
						<span className="label">. Please Check Back Later.</span>
					</div>
				)}
				{applicationStatus === 'rejected' && cooldownDaysLeft && (
					<div className="info-message">
						<span className="label">Your Application ID: </span>
						<span className="value">{applicationId}</span>
						<br />
						<span className="label">Your Application Has Been </span>
						<span className="status rejected">Rejected</span>
						<span className="label">. You Can Apply Again In </span>
						<span className="value">{cooldownDaysLeft} Days.</span>
					</div>
				)}
				{applicationStatus === 'approved' && (
					<div className="info-message">
						<span className="label">Your Application Has Been </span>
						<span className="status accepted">Accepted</span>
						<span className="label">. Welcome To The Synthwave Roleplay!</span>
					</div>
				)}
				<button type="button" onClick={handleGoBack} className="form-button">
					Home
				</button>
			</div>
		);
	}

	return (
		<div className="form-container">
			<form onSubmit={handleSubmit}>
				{currentSection === 1 && !submissionStatus && (
					<div className="section">
						<h2>Personal Information</h2>
						<label>
							Real Name
							<input
								type="text"
								name="real_name"
								value={formData.real_name}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							Age
							<input
								type="number"
								name="age"
								value={formData.age}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							Discord UserID
							<input
								type="text"
								name="discord_user_id"
								value={formData.discord_user_id}
								onChange={handleChange}
								required
								disabled
							/>
						</label>
						<label>
							Do you have a working microphone?
							<Select
								placeholder="Select an option"
								data={[
									{ value: 'yes', label: 'Yes' },
									{ value: 'no', label: 'No' },
								]}
								value={formData.microphone}
								onChange={(value) =>
									setFormData((prev) => ({ ...prev, microphone: value || '' }))
								}
								required
								styles={{
									input: {
										border: 'none',
										outline: 'none',
										boxShadow: 'none',
										'&:focus': {
											border: 'none',
											outline: 'none',
											boxShadow: 'none',
										},
									},
								}}
							/>
						</label>
						<button type="button" onClick={handleGoBack} className="form-button">Back</button>
						<button type="button" onClick={handleNext} className="form-button" disabled={isSubmitting}>Next</button>
					</div>
				)}

				{currentSection === 2 && !submissionStatus && (
					<div className="section">
						<h2>Roleplay Experience</h2>
						<label>
							Have you played on any other GTA RP servers? If yes, list them
							<textarea
								name="other_servers"
								value={formData.other_servers}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							Describe a memorable RP scenario you’ve experienced or observed
							<textarea
								name="memorable_scenario"
								value={formData.memorable_scenario}
								onChange={handleChange}
								required
							/>
						</label>
						<button type="button" onClick={handlePrev} className="form-button">Previous</button>
						<button type="button" onClick={handleNext} className="form-button" disabled={isSubmitting}>Next</button>
					</div>
				)}

				{currentSection === 3 && !submissionStatus && (
					<div className="section">
						<h2>Character Information</h2>
						<label>
							Character Name
							<input
								type="text"
								name="character_name"
								value={formData.character_name}
								onChange={handleChange}
								required
								maxLength={50}
							/>
						</label>
						<label>
							Write a detailed backstory for your character (Minimum 250 words)
							<textarea
								name="backstory"
								value={formData.backstory}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							What is your character's primary goal or ambition in our server?
							<textarea
								name="goal"
								value={formData.goal}
								onChange={handleChange}
								required
							/>
						</label>
						<button type="button" onClick={handlePrev} className="form-button">Previous</button>
						<button
							type="button"
							onClick={handleNext}
							className="form-button"
							disabled={isSubmitting}>
							Next
						</button>
					</div>
				)}
				{currentSection === 4 && !submissionStatus && (
					<div className="section">
						<h2>Server Rules and Knowledge Check</h2>
						<label>
							What does "Fail RP" mean? Provide an example
							<textarea
								name="fail_rp"
								value={formData.fail_rp}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							Explain what "Metagaming" is and why it's not allowed
							<textarea
								name="metagaming"
								value={formData.metagaming}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							What is "Powergaming"? Provide an example (Minimum 150 words)
							<textarea
								name="powergaming"
								value={formData.powergaming}
								onChange={handleChange}
								required
							/>
						</label>
						<button type="button" onClick={handlePrev} className="form-button">Previous</button>
						<button
							type="button"
							onClick={handleNext}
							className="form-button"
							disabled={isSubmitting}>
							Next
						</button>
					</div>
				)}
				{currentSection === 5 && !submissionStatus && (
					<div className="section">
						<h2>Scenario-Based Questions</h2>
						<label>
							You witness someone breaking server rules during an RP session. What do you do?
							<textarea
								name="scenario1"
								value={formData.scenario1}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							You see a rival gang member enter your turf. How do you react?
							<textarea
								name="scenario2"
								value={formData.scenario2}
								onChange={handleChange}
								required
							/>
						</label>
						<label>
							Your character is falsely accused of a crime they didn’t commit and faces arrest. How would you respond?
							<textarea
								name="scenario3"
								value={formData.scenario3}
								onChange={handleChange}
								required
							/>
						</label>
						<button type="button" onClick={handlePrev} className="form-button">Previous</button>
						<button
							type="button"
							onClick={handleNext}
							className="form-button"
							disabled={isSubmitting}>
							Next
						</button>
					</div>
				)}
				{currentSection === 6 && !submissionStatus && (
					<div className="section">
						<h2>Agreement</h2>
						<Checkbox
							label="By submitting this application, I confirm that I have read and agree to follow the server rules."
							color="#8685ef"
							name="agreement"
							checked={formData.agreement}
							onChange={handleChange}
							required
						/>
						{!submitting && (
							<>
								<button type="button" onClick={handlePrev} className="form-button">
									Previous
								</button>
								<button type="submit" className="form-button" disabled={submitting}>
									{submitting ? 'Submitting...' : 'Submit'}
								</button>
							</>
						)}
					</div>
				)}
			</form>
		</div>
	);
};

export default ApplicationForm;
