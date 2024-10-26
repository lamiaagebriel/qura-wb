import KY from 'ky'

export const ky = KY.create({
	parseJson: (text) =>
		JSON.parse(text, (key, value) => {
			if (key.endsWith('At')) return new Date(value)
			return value
		}),
})
