package command

import (
	"github.com/spf13/cobra"
)

func InitCommand() (root *cobra.Command, err error) {
	var rootCmd = &cobra.Command{
		Use:   "app",
		Short: "",
		Long:  ``,
	}

	return rootCmd, nil
}
